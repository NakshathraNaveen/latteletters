-- Search tweaks found by testing typo searches on real cafes:
--  - with a location, candidates near you come first. Before, "starbucks"
--    returned 120 arbitrary Starbucks and usually not the one down the street.
--  - typo mode near you uses the first TWO letters (was three), so a typo in
--    the 3rd letter ("orrchid" for "orchid") still finds it. It stays cheap
--    because it only looks within ~50 km and takes the nearest.

create or replace function public.search_overture_cafes(
  q text,
  near_lat double precision default null,
  near_lng double precision default null,
  max_results integer default 120,
  typo_mode boolean default false
)
returns setof public.overture_cafes
language plpgsql stable set search_path = '' as $$
declare
  ws text[];
  strong text[];
  parts text[] := '{}';
  w text;
  i integer;
  tsq tsquery;
  lim integer := least(greatest(max_results, 1), 200);
  dlat double precision := 0.45;
  dlng double precision;
  found integer;
begin
  select array_agg(distinct x) into ws
    from unnest(regexp_split_to_array(trim(regexp_replace(public.ll_fold(q), '[^[:alnum:][:space:]]+', ' ', 'g')), '\s+')) as x
   where char_length(x) >= 2;
  if ws is null or cardinality(ws) > 8 then
    return;
  end if;
  if near_lat is not null then
    dlng := 0.45 / greatest(0.2, cos(radians(near_lat)));
  end if;

  strong := array(select x from unnest(ws) as x
                   where x <> all (array['coffee', 'cafe', 'caffe', 'tea', 'shop', 'the', 'and', 'bar', 'house', 'co', 'company',
                                         'bakery', 'roasters', 'roastery', 'espresso', 'kitchen', 'de', 'la', 'le', 'el', 'of']));
  if cardinality(strong) = 0 then
    strong := ws;
  end if;

  if not typo_mode then
    foreach w in array strong loop
      parts := parts || (quote_literal(w) || ':*');
      if char_length(w) between 4 and 14 then
        for i in 2 .. char_length(w) - 2 loop
          parts := parts || ('(' || quote_literal(left(w, i)) || ' & ' || quote_literal(substr(w, i + 1)) || ':*)');
        end loop;
      end if;
    end loop;
    tsq := to_tsquery('simple', array_to_string(parts, ' | '));

    if near_lat is not null then
      -- nearby matches first, then the best matches anywhere fill the rest
      return query
        select c.* from public.overture_cafes c
         where c.lat between near_lat - dlat and near_lat + dlat
           and c.lng between near_lng - dlng and near_lng + dlng
           and to_tsvector('simple', public.ll_fold(c.name) || ' ' || public.ll_fold(c.city)) @@ tsq
         order by ts_rank(to_tsvector('simple', public.ll_fold(c.name) || ' ' || public.ll_fold(c.city)), tsq) desc,
                  (c.lat - near_lat) ^ 2 + ((c.lng - near_lng) * cos(radians(near_lat))) ^ 2
         limit lim;
      get diagnostics found = row_count;
      if found < lim then
        return query
          select c.* from public.overture_cafes c
           where to_tsvector('simple', public.ll_fold(c.name) || ' ' || public.ll_fold(c.city)) @@ tsq
             and not (c.lat between near_lat - dlat and near_lat + dlat
                      and c.lng between near_lng - dlng and near_lng + dlng)
           order by ts_rank(to_tsvector('simple', public.ll_fold(c.name) || ' ' || public.ll_fold(c.city)), tsq) desc,
                    c.confidence desc nulls last
           limit lim - found;
      end if;
      return;
    end if;

    return query
      select c.* from public.overture_cafes c
       where to_tsvector('simple', public.ll_fold(c.name) || ' ' || public.ll_fold(c.city)) @@ tsq
       order by ts_rank(to_tsvector('simple', public.ll_fold(c.name) || ' ' || public.ll_fold(c.city)), tsq) desc,
                c.confidence desc nulls last
       limit lim;
    return;
  end if;

  if near_lat is not null then
    -- typo mode near you: first two letters of each word, nearest first
    foreach w in array strong loop
      if char_length(w) >= 3 then
        parts := parts || (quote_literal(left(w, 2)) || ':*');
      end if;
    end loop;
    if cardinality(parts) = 0 then
      return;
    end if;
    tsq := to_tsquery('simple', array_to_string(parts, ' | '));
    return query
      select c.* from public.overture_cafes c
       where to_tsvector('simple', public.ll_fold(c.name) || ' ' || public.ll_fold(c.city)) @@ tsq
         and c.lat between near_lat - dlat and near_lat + dlat
         and c.lng between near_lng - dlng and near_lng + dlng
       order by (c.lat - near_lat) ^ 2 + ((c.lng - near_lng) * cos(radians(near_lat))) ^ 2
       limit lim;
    return;
  end if;

  -- typo mode anywhere: first three letters, every word has to match
  foreach w in array strong loop
    if char_length(w) >= 4 then
      parts := parts || (quote_literal(left(w, 3)) || ':*');
    end if;
  end loop;
  if cardinality(parts) >= 2 then
    tsq := to_tsquery('simple', array_to_string(parts, ' & '));
    return query
      select c.* from public.overture_cafes c
       where to_tsvector('simple', public.ll_fold(c.name) || ' ' || public.ll_fold(c.city)) @@ tsq
       order by c.confidence desc nulls last
       limit lim;
  end if;
end $$;
