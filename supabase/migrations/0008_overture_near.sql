-- Nearest Overture cafes to a point. PostgREST caps plain selects at 1000
-- rows in no particular order, so busy cities need the database to sort by
-- distance and cut off there instead.
create or replace function public.overture_cafes_near(lat double precision, lng double precision, radius_km double precision, max_results integer default 800)
returns setof public.overture_cafes
language sql stable set search_path = '' as $$
  with box as (
    select radius_km / 111.0 as dlat,
           radius_km / (111.0 * greatest(0.2, cos(radians(lat)))) as dlng
  )
  select c.*
    from public.overture_cafes c, box
   where c.lat between lat - box.dlat and lat + box.dlat
     and c.lng between lng - box.dlng and lng + box.dlng
   order by (c.lat - lat) ^ 2 + ((c.lng - lng) * cos(radians(lat))) ^ 2
   limit least(greatest(max_results, 1), 1000)
$$;

grant execute on function public.overture_cafes_near(double precision, double precision, double precision, integer) to anon, authenticated;
