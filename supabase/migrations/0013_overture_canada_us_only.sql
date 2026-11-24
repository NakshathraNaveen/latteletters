-- Keep only Canada and the US in overture_cafes for now. 1.5M worldwide
-- cafes were too much for the free-plan database (slow cold reads, two
-- outages). Elsewhere the site falls back to OpenStreetMap (Nominatim/Photon).
-- Rows are re-inserted in map order so area searches read few pages.
-- To bring more countries back: scripts/overture import with --countries.

begin;

create temp table overture_keep on commit drop as
  select * from public.overture_cafes where country in ('CA', 'US');

drop index if exists public.overture_cafes_search_idx;
drop index if exists public.overture_cafes_geo_idx;

truncate public.overture_cafes;

insert into public.overture_cafes
  select * from overture_keep order by lat, lng;

create index overture_cafes_geo_idx on public.overture_cafes (lat, lng);
create index overture_cafes_search_idx on public.overture_cafes
  using gin (to_tsvector('simple', public.ll_fold(name) || ' ' || public.ll_fold(city)));

commit;

analyze public.overture_cafes;
