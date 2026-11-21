-- latteletters Phase 2a: accounts, reviews & love notes.
-- Security model: the public (anon/authenticated roles) can only READ public
-- data. Every write goes through Next.js server actions using the service
-- role, after login, profanity and rate-limit checks.

-- ───────────── profiles ─────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  avatar text not null default 'iced-latte' check (char_length(avatar) <= 40),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ───────────── posts (reviews + love notes) ─────────────
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  cafe_id text not null check (cafe_id ~ '^(node|way|relation)-[0-9]{1,15}$'),
  cafe_name text not null check (char_length(cafe_name) between 1 and 200),
  kind text not null check (kind in ('review', 'note')),
  rating smallint,
  drink text check (char_length(drink) <= 60),
  vibes text[] not null default '{}' check (cardinality(vibes) <= 6),
  body text not null,
  photos text[] not null default '{}' check (cardinality(photos) <= 3),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  report_count integer not null default 0,
  reviewed_by_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_shape check (
    (kind = 'review' and rating between 1 and 5 and char_length(body) between 1 and 2000)
    or
    (kind = 'note' and rating is null and cardinality(photos) = 0 and char_length(body) between 1 and 280)
  )
);

create index if not exists posts_cafe_idx on public.posts (cafe_id, created_at desc);
create index if not exists posts_user_idx on public.posts (user_id, created_at desc);
create index if not exists posts_reported_idx on public.posts (report_count) where report_count > 0;
-- one review per person per cafe (love notes are rate-limited instead)
create unique index if not exists one_review_per_cafe on public.posts (user_id, cafe_id) where kind = 'review';

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update of body, rating, drink, vibes, photos on public.posts
  for each row execute function public.touch_updated_at();

-- ───────────── reports ─────────────
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text check (char_length(reason) <= 300),
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

-- 2 reports hide a post until an admin looks at it
create or replace function public.on_report() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.posts
     set report_count = report_count + 1,
         status = case when report_count + 1 >= 2 then 'hidden' else status end,
         reviewed_by_admin = false
   where id = new.post_id;
  return new;
end $$;

drop trigger if exists reports_count on public.reports;
create trigger reports_count after insert on public.reports
  for each row execute function public.on_report();

-- ───────────── row level security ─────────────
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.reports enable row level security;

drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public" on public.profiles for select using (true);

drop policy if exists "visible posts are public" on public.posts;
create policy "visible posts are public" on public.posts for select using (status = 'visible');

-- reports: no policies → nobody but the service role can read or write them.

-- belt and braces: the public roles never write directly
revoke insert, update, delete on public.profiles, public.posts, public.reports from anon, authenticated;
-- and never see who is an admin
revoke select (is_admin) on public.profiles from anon, authenticated;

-- ───────────── photo storage ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-photos', 'review-photos', true, 2097152, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
-- No storage.objects policies: uploads only happen through signed URLs the
-- server creates; files are readable via the bucket's public URLs.
