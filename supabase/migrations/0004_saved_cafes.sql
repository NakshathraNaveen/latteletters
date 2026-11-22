-- Saved cafes ("my cafe list"). Private: RLS is on with no policies, so only
-- the server (service role) can read or write it. Rows go when the account does.
create table if not exists public.saved_cafes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  cafe_id text not null check (cafe_id ~ '^(node|way|relation)-[0-9]{1,15}$'),
  name text not null check (char_length(name) between 1 and 200),
  place text check (char_length(place) <= 200),
  accent text not null default 'hotpink' check (accent in ('hotpink', 'lavender', 'olive', 'lime', 'lemon')),
  created_at timestamptz not null default now(),
  primary key (user_id, cafe_id)
);

create index if not exists saved_cafes_user_idx on public.saved_cafes (user_id, created_at desc);

alter table public.saved_cafes enable row level security;
revoke all on public.saved_cafes from anon, authenticated;
