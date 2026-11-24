-- Forgiving cafe name search, using the existing search index (rebuilding a
-- big index here once took the free-plan database down, so this avoids it).
--
-- Before: every word had to prefix-match exactly, so "lala bakeshop" missed
-- "LA LA Bakeshop" (indexed as the words "la" + "la") and one typo missed
-- everything. Now:
--  - a cafe matches if ANY distinctive word does (very common words like
--    "coffee" or "cafe" only count when they're all you typed)
--  - joined words are also tried split ("lala" → "la" + "la",
--    "bakeshop" → "bake" + "shop"); split ones already prefix-match
--  - typo_mode: the first three letters of each word, for when every word has
--    a typo. Kept narrow so it stays cheap: near you if we know where, else
--    every word has to match
--  - the app ranks the candidates with typo tolerance (src/lib/match.ts)

-- only the monthly import used this (a full scan is fine there); frees ~30 MB
drop index if exists public.overture_cafes_country_idx;

drop function if exists public.search_overture_cafes(text, double precision, double precision, integer);

create function public.search_overture_cafes(
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
begin
  select array_agg(distinct x) into ws
    from unnest(regexp_split_to_array(trim(regexp_replace(public.ll_fold(q), '[^[:alnum:][:space:]]+', ' ', 'g')), '\s+')) as x
   where char_length(x) >= 2;
  if ws is null or cardinality(ws) > 8 then
    return;
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
    return query
      select c.* from public.overture_cafes c
       where to_tsvector('simple', public.ll_fold(c.name) || ' ' || public.ll_fold(c.city)) @@ tsq
       order by ts_rank(to_tsvector('simple', public.ll_fold(c.name) || ' ' || public.ll_fold(c.city)), tsq) desc,
                case when near_lat is null then 0
                     else (c.lat - near_lat) ^ 2 + ((c.lng - near_lng) * cos(radians(near_lat))) ^ 2 end,
                c.confidence desc nulls last
       limit lim;
    return;
  end if;

  -- typo mode: first three letters of each longer word
  foreach w in array strong loop
    if char_length(w) >= 4 then
      parts := parts || (quote_literal(left(w, 3)) || ':*');
    end if;
  end loop;

  if near_lat is not null and cardinality(parts) >= 1 then
    -- any of them, within ~50 km of you
    tsq := to_tsquery('simple', array_to_string(parts, ' | '));
    return query
      select c.* from public.overture_cafes c
       where to_tsvector('simple', public.ll_fold(c.name) || ' ' || public.ll_fold(c.city)) @@ tsq
         and c.lat between near_lat - 0.45 and near_lat + 0.45
         and c.lng between near_lng - 0.45 / greatest(0.2, cos(radians(near_lat))) and near_lng + 0.45 / greatest(0.2, cos(radians(near_lat)))
       order by ts_rank(to_tsvector('simple', public.ll_fold(c.name) || ' ' || public.ll_fold(c.city)), tsq) desc,
                (c.lat - near_lat) ^ 2 + ((c.lng - near_lng) * cos(radians(near_lat))) ^ 2
       limit lim;
  elsif cardinality(parts) >= 2 then
    -- anywhere, but every word has to match
    tsq := to_tsquery('simple', array_to_string(parts, ' & '));
    return query
      select c.* from public.overture_cafes c
       where to_tsvector('simple', public.ll_fold(c.name) || ' ' || public.ll_fold(c.city)) @@ tsq
       order by c.confidence desc nulls last
       limit lim;
  end if;
end $$;

grant execute on function public.search_overture_cafes(text, double precision, double precision, integer, boolean) to anon, authenticated;
