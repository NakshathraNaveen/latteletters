-- Cafe crews: small private friend groups that share a cafe list.
-- Every table has RLS on with no policies: only the server (service role)
-- reads or writes them, and it checks membership first.

create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  emoji text not null default '☕' check (char_length(emoji) between 1 and 8),
  invite_code text not null unique check (invite_code ~ '^[A-Za-z0-9_-]{12}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.crew_members (
  crew_id uuid not null references public.crews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (crew_id, user_id)
);
create index if not exists crew_members_user_idx on public.crew_members (user_id);

create table if not exists public.crew_invites (
  crew_id uuid not null references public.crews (id) on delete cascade,
  invitee_id uuid not null references public.profiles (id) on delete cascade,
  inviter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (crew_id, invitee_id)
);
create index if not exists crew_invites_invitee_idx on public.crew_invites (invitee_id);
create index if not exists crew_invites_inviter_idx on public.crew_invites (inviter_id, created_at);

create table if not exists public.crew_cafes (
  crew_id uuid not null references public.crews (id) on delete cascade,
  cafe_id text not null check (cafe_id ~ '^(node|way|relation)-[0-9]{1,15}$'),
  name text not null check (char_length(name) between 1 and 200),
  place text check (char_length(place) <= 200),
  accent text not null default 'hotpink' check (accent in ('hotpink', 'lavender', 'olive', 'lime', 'lemon')),
  added_by uuid references public.profiles (id) on delete set null,
  note text check (char_length(note) <= 140),
  created_at timestamptz not null default now(),
  primary key (crew_id, cafe_id)
);

create table if not exists public.crew_cafe_hearts (
  crew_id uuid not null,
  cafe_id text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (crew_id, cafe_id, user_id),
  foreign key (crew_id, cafe_id) references public.crew_cafes (crew_id, cafe_id) on delete cascade
);

alter table public.crews enable row level security;
alter table public.crew_members enable row level security;
alter table public.crew_invites enable row level security;
alter table public.crew_cafes enable row level security;
alter table public.crew_cafe_hearts enable row level security;
revoke all on public.crews, public.crew_members, public.crew_invites, public.crew_cafes, public.crew_cafe_hearts from anon, authenticated;
