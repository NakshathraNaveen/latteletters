-- latteletters: everyone's go-to order, shown as a receipt on their profile
-- (the same receipt as the creator page). Public to read; written only by
-- the saveGoToOrder server action. Deleted with the account.

create table if not exists public.go_to_orders (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  drink text check (char_length(drink) <= 120),
  size text check (char_length(size) <= 40),
  milk text check (char_length(milk) <= 60),
  sweetness text check (char_length(sweetness) <= 40),
  temperature text check (char_length(temperature) <= 40),
  extras text check (char_length(extras) <= 120),
  notes text[] not null default '{}' check (cardinality(notes) <= 3),
  updated_at timestamptz not null default now()
);

alter table public.go_to_orders enable row level security;
drop policy if exists "go-to orders are public" on public.go_to_orders;
create policy "go-to orders are public" on public.go_to_orders for select using (true);
revoke insert, update, delete on public.go_to_orders from anon, authenticated;
