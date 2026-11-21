-- Column-level revokes don't override a table-wide grant, so grant columns explicitly.
revoke select on public.profiles from anon, authenticated;
grant select (id, username, avatar, created_at) on public.profiles to anon, authenticated;
