-- "what was playing?": an optional Spotify link on reviews and love notes.
-- Stored as "track:<id>" / "album:<id>" / "playlist:<id>", plus the title Spotify gave us.
alter table public.posts
  add column if not exists song text check (song ~ '^(track|album|playlist):[A-Za-z0-9]{22}$'),
  add column if not exists song_title text check (char_length(song_title) <= 200);

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update of body, rating, drink, vibes, photos, song on public.posts
  for each row execute function public.touch_updated_at();
