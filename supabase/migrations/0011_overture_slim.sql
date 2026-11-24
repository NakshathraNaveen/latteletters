-- Slimmer Overture table so all ~1.5M cafes worldwide fit in the free
-- Supabase plan (500 MB): ~140 bytes a cafe instead of ~216.
--  - lat/lng as real (4 bytes, ~1 m precision) instead of double
--  - category as a small number (see KINDS in src/lib/overture.ts)
--  - website without "https://www.", no Facebook page links, no region
--  - release as a day number (20261118) instead of text
-- The data is re-importable (scripts/overture/import.mjs), so recreate it.

drop function if exists public.search_overture_cafes(text, double precision, double precision, integer);
drop function if exists public.overture_cafes_near(double precision, double precision, double precision, integer);
drop table if exists public.overture_cafes;

create table public.overture_cafes (
  id uuid primary key,
  lat real not null,
  lng real not null,
  kind smallint not null default 0,
  release_day integer not null,
  confidence real,
  country char(2),
  name text not null,
  street text,
  city text,
  brand text,
  website text,
  instagram text
);

create index overture_cafes_geo_idx on public.overture_cafes (lat, lng);
create index overture_cafes_country_idx on public.overture_cafes (country, release_day);
create index overture_cafes_search_idx on public.overture_cafes
  using gin (to_tsvector('simple', public.ll_fold(name) || ' ' || public.ll_fold(city)));

alter table public.overture_cafes enable row level security;
create policy "overture cafes are public" on public.overture_cafes for select using (true);
revoke insert, update, delete on public.overture_cafes from anon, authenticated;

create function public.search_overture_cafes(q text, near_lat double precision default null, near_lng double precision default null, max_results integer default 10)
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

create function public.overture_cafes_near(lat double precision, lng double precision, radius_km double precision, max_results integer default 800)
returns setof public.overture_cafes
language sql stable set search_path = '' as $$
  -- $1 = lat, $2 = lng, $3 = radius_km, $4 = max_results (by position: the
  -- table has lat/lng columns too, and in SQL functions column names win)
  with box as (
    select $3 / 111.0 as dlat,
           $3 / (111.0 * greatest(0.2, cos(radians($1)))) as dlng
  )
  select c.*
    from public.overture_cafes c, box
   where c.lat between $1 - box.dlat and $1 + box.dlat
     and c.lng between $2 - box.dlng and $2 + box.dlng
   order by (c.lat - $1) ^ 2 + ((c.lng - $2) * cos(radians($1))) ^ 2
   limit least(greatest($4, 1), 1000)
$$;

grant execute on function public.search_overture_cafes(text, double precision, double precision, integer) to anon, authenticated;
grant execute on function public.overture_cafes_near(double precision, double precision, double precision, integer) to anon, authenticated;
