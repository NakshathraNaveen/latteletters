-- latteletters: community cafes.
-- Cafes people add themselves when a spot isn't on OpenStreetMap yet.
-- They stay on the site for good: deleting the account that added one keeps
-- the cafe (and other people's reviews of it), it just loses the "added by".
-- Same security model as posts: public reads of visible rows, writes only
-- through server actions using the service role.

create table if not exists public.community_cafes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  street text check (char_length(street) <= 120),
  neighbourhood text check (char_length(neighbourhood) <= 80),
  city text check (char_length(city) <= 80),
  country text check (char_length(country) <= 80),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  kind text not null default 'coffee' check (kind in ('coffee', 'tea', 'bubble_tea', 'bakery', 'dessert')),
  instagram text check (instagram ~ '^[A-Za-z0-9_.]{1,30}$'),
  added_by uuid references public.profiles (id) on delete set null,
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  report_count integer not null default 0,
  reviewed_by_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists community_cafes_geo_idx on public.community_cafes (lat, lng) where status = 'visible';
create index if not exists community_cafes_added_idx on public.community_cafes (added_by, created_at desc);
create index if not exists community_cafes_reported_idx on public.community_cafes (report_count) where report_count > 0;

-- ───────────── reports (3 hide a cafe until an admin looks) ─────────────
create table if not exists public.community_cafe_reports (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.community_cafes (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text check (char_length(reason) <= 300),
  created_at timestamptz not null default now(),
  unique (cafe_id, reporter_id)
);

create or replace function public.on_cafe_report() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.community_cafes
     set report_count = report_count + 1,
         status = case when report_count + 1 >= 3 then 'hidden' else status end,
         reviewed_by_admin = false
   where id = new.cafe_id;
  return new;
end $$;

drop trigger if exists community_cafe_reports_count on public.community_cafe_reports;
create trigger community_cafe_reports_count after insert on public.community_cafe_reports
  for each row execute function public.on_cafe_report();

-- ───────────── row level security ─────────────
alter table public.community_cafes enable row level security;
alter table public.community_cafe_reports enable row level security;

drop policy if exists "visible community cafes are public" on public.community_cafes;
create policy "visible community cafes are public" on public.community_cafes for select using (status = 'visible');
-- reports: no policies, so only the service role can read or write them.

revoke insert, update, delete on public.community_cafes, public.community_cafe_reports from anon, authenticated;

-- ───────────── cafe ids: OSM ("node-123") or community ("c-<uuid>") ─────────────
alter table public.posts drop constraint if exists posts_cafe_id_check;
alter table public.posts add constraint posts_cafe_id_check
  check (cafe_id ~ '^((node|way|relation)-[0-9]{1,15}|c-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$');

alter table public.saved_cafes drop constraint if exists saved_cafes_cafe_id_check;
alter table public.saved_cafes add constraint saved_cafes_cafe_id_check
  check (cafe_id ~ '^((node|way|relation)-[0-9]{1,15}|c-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$');

alter table public.crew_cafes drop constraint if exists crew_cafes_cafe_id_check;
alter table public.crew_cafes add constraint crew_cafes_cafe_id_check
  check (cafe_id ~ '^((node|way|relation)-[0-9]{1,15}|c-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$');
