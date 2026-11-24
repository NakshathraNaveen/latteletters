-- latteletters: cafes from Overture Maps (https://overturemaps.org).
-- Far better coverage of small cafes than OpenStreetMap alone. Loaded and
-- refreshed by scripts/overture/import.mjs; the website only reads it.
-- Data licences: CDLA-Permissive-2.0 (Overture, Meta, Microsoft…),
-- Apache-2.0 (Foursquare), CC0 (AllThePlaces). Attribution on every page that shows it.

create extension if not exists unaccent with schema extensions;

-- unaccent() isn't immutable (it reads a dictionary), so wrap it for use in an index
create or replace function public.ll_fold(t text) returns text
language sql immutable parallel safe set search_path = '' as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(t, '')))
$$;

create table if not exists public.overture_cafes (
  id uuid primary key,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  category text not null,
  street text,
  city text,
  region text,
  country text,
  brand text,
  website text,
  facebook text,
  instagram text,
  confidence real,
  release text not null
);

create index if not exists overture_cafes_geo_idx on public.overture_cafes (lat, lng);
create index if not exists overture_cafes_country_idx on public.overture_cafes (country, release);
create index if not exists overture_cafes_search_idx on public.overture_cafes
  using gin (to_tsvector('simple', public.ll_fold(name) || ' ' || public.ll_fold(city)));

alter table public.overture_cafes enable row level security;
drop policy if exists "overture cafes are public" on public.overture_cafes;
create policy "overture cafes are public" on public.overture_cafes for select using (true);
revoke insert, update, delete on public.overture_cafes from anon, authenticated;

-- "pilot coffee toronto" → cafes whose name + city contain every word (last
-- word as a prefix, so it works while typing), nearest first if we know where.
create or replace function public.search_overture_cafes(q text, near_lat double precision default null, near_lng double precision default null, max_results integer default 10)
returns setof public.overture_cafes
language sql stable set search_path = '' as $$
  with words as (
    select array_agg(w) as ws
      from unnest(regexp_split_to_array(trim(regexp_replace(public.ll_fold(q), '[^[:alnum:][:space:]]+', ' ', 'g')), '\s+')) as w
     where w <> ''
  ),
  query as (
    select to_tsquery('simple', array_to_string(array(select quote_literal(w) || ':*' from unnest(ws) as w), ' & ')) as tsq
      from words
     where cardinality(ws) between 1 and 6
  )
  select c.*
    from public.overture_cafes c, query
   where to_tsvector('simple', public.ll_fold(c.name) || ' ' || public.ll_fold(c.city)) @@ query.tsq
   order by
     case when near_lat is null then 0
          else (c.lat - near_lat) ^ 2 + ((c.lng - near_lng) * cos(radians(near_lat))) ^ 2 end,
     c.confidence desc nulls last
   limit least(greatest(max_results, 1), 20)
$$;

grant execute on function public.search_overture_cafes(text, double precision, double precision, integer) to anon, authenticated;

-- ───────────── cafe ids gain a third kind: "o-<uuid>" ─────────────
alter table public.posts drop constraint if exists posts_cafe_id_check;
alter table public.posts add constraint posts_cafe_id_check
  check (cafe_id ~ '^((node|way|relation)-[0-9]{1,15}|[co]-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$');

alter table public.saved_cafes drop constraint if exists saved_cafes_cafe_id_check;
alter table public.saved_cafes add constraint saved_cafes_cafe_id_check
  check (cafe_id ~ '^((node|way|relation)-[0-9]{1,15}|[co]-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$');

alter table public.crew_cafes drop constraint if exists crew_cafes_cafe_id_check;
alter table public.crew_cafes add constraint crew_cafes_cafe_id_check
  check (cafe_id ~ '^((node|way|relation)-[0-9]{1,15}|[co]-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$');
