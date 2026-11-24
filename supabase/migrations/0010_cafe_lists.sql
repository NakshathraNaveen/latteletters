-- latteletters: cafe lists. Anyone can make lists ("best study spots in
-- Toronto"), each cafe with what to order and a note. Lists are private
-- unless their owner makes them public.
-- Like crews: RLS on with no policies, so only the server (service role)
-- reads or writes them, after checking the viewer owns the list or it's public.

create table if not exists public.cafe_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  description text check (char_length(description) <= 280),
  emoji text not null default '☕' check (char_length(emoji) between 1 and 8),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cafe_lists_user_idx on public.cafe_lists (user_id, created_at desc);

create table if not exists public.cafe_list_items (
  list_id uuid not null references public.cafe_lists (id) on delete cascade,
  cafe_id text not null check (cafe_id ~ '^((node|way|relation)-[0-9]{1,15}|[co]-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$'),
  name text not null check (char_length(name) between 1 and 200),
  place text check (char_length(place) <= 200),
  accent text not null default 'hotpink' check (accent in ('hotpink', 'lavender', 'olive', 'lime', 'lemon')),
  recommend text check (char_length(recommend) <= 120),
  note text check (char_length(note) <= 280),
  created_at timestamptz not null default now(),
  primary key (list_id, cafe_id)
);
create index if not exists cafe_list_items_cafe_idx on public.cafe_list_items (cafe_id);

alter table public.cafe_lists enable row level security;
alter table public.cafe_list_items enable row level security;
revoke all on public.cafe_lists, public.cafe_list_items from anon, authenticated;
