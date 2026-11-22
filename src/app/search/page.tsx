import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CafeIdCard, formatDistance } from "@/components/CafeIdCard";
import CafeMap, { type MapPin } from "@/components/CafeMap";
import { DrinkCup } from "@/components/DrinkCup";
import { DripLoader } from "@/components/DripLoader";
import { FolderTabs } from "@/components/FolderTabs";
import { ResultControls } from "@/components/ResultControls";
import { SearchBar } from "@/components/SearchBar";
import { Sparkle } from "@/components/decor";
import { DRINKS, type DrinkId } from "@/lib/drinks";
import { openState, type OpenState } from "@/lib/hours";
import { SpotifyPlayer } from "@/components/SpotifyPlayer";
import { MOOD_PLAYLISTS } from "@/data/playlists";
import { moodPlaylist } from "@/lib/spotify";
import { getCurrentUser } from "@/lib/auth";
import { savedIdsSafe } from "@/lib/saved";
import { cafesNear, distanceKm, geocode, roundCoord } from "@/lib/osm";
import { DEFAULT_RADIUS, POPULAR_PLACES, RADII } from "@/lib/places";
import { cafeStatsSafe, type CafeStats } from "@/lib/posts";
import { interpret, rankCafes, suggest, type ScoredCafe } from "@/lib/search";
import type { Cafe, Place } from "@/lib/types";
import { VIBES } from "@/lib/vibes";

export const metadata: Metadata = {
  title: "Search cafes",
  description: "Find cafes anywhere in the world by drink, mood or vibe.",
};

const MAX_RESULTS = 36;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <Suspense fallback={<DripLoader />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

type Params = { q: string; where: string; lat: string; lng: string; r: string; sort: string; f: string; view: string };

const SORTS = [
  { key: "match", label: "best match" },
  { key: "near", label: "closest" },
  { key: "rated", label: "top rated" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

type FilterCtx = { open: Map<string, OpenState> };
const FILTERS = [
  { key: "open", label: "open now", test: (c: Cafe, x: FilterCtx) => x.open.get(c.id) === "open" },
  { key: "vegan", label: "vegan options", test: (c: Cafe) => c.vegan },
  { key: "wifi", label: "wifi", test: (c: Cafe) => c.wifi },
  { key: "outdoor", label: "outdoor seating", test: (c: Cafe) => c.outdoorSeating },
  { key: "indie", label: "independent", test: (c: Cafe) => !c.brand },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const ACCENT_HEX: Record<Cafe["accent"], string> = {
  hotpink: "#f08cb8",
  lavender: "#b9a9e8",
  olive: "#c5d28a",
  lime: "#d4f31e",
  lemon: "#fffde9",
};

/** Re-order results. "top rated" lifts reviewed cafes; everyone else keeps best-match order. */
function sortResults(results: ScoredCafe[], sort: SortKey, stats: Record<string, CafeStats>) {
  if (sort === "near") return [...results].sort((a, b) => (a.cafe.distanceKm ?? 0) - (b.cafe.distanceKm ?? 0));
  if (sort === "rated")
    return [...results].sort((a, b) => {
      const sa = stats[a.cafe.id];
      const sb = stats[b.cafe.id];
      return (sb?.reviews ? sb.avg : -1) - (sa?.reviews ? sa.avg : -1) || (sb?.reviews ?? 0) - (sa?.reviews ?? 0);
    });
  return results;
}

function buildHref(p: Partial<Params>) {
  const s = new URLSearchParams(Object.entries(p).filter(([, v]) => v) as [string, string][]);
  return `/search?${s}`;
}

async function Results({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const sp = await searchParams;
  const q = first(sp.q).slice(0, 120).trim();
  const where = first(sp.where).slice(0, 120).trim();
  const r = RADII.some((x) => x.value === first(sp.r)) ? first(sp.r) : DEFAULT_RADIUS;
  const latN = Number(first(sp.lat));
  const lngN = Number(first(sp.lng));
  const hasCoords = first(sp.lat) !== "" && Number.isFinite(latN) && Number.isFinite(lngN) && Math.abs(latN) <= 90 && Math.abs(lngN) <= 180;
  const coords = hasCoords ? { lat: roundCoord(latN).toFixed(3), lng: roundCoord(lngN).toFixed(3) } : undefined;

  const it = interpret(q);

  // ── where are we looking? ──
  let place: Place | null = null;
  let nameWords: string[] = [];
  let placeText = "";
  try {
    if (where) {
      placeText = where;
      place = await geocode(where);
      nameWords = it.unknown;
    } else if (coords) {
      place = { name: "you", label: "you", lat: Number(coords.lat), lng: Number(coords.lng) };
      nameWords = it.unknown;
    } else if (it.unknown.length) {
      placeText = it.unknown.join(" ");
      place = await geocode(placeText);
    }
  } catch {
    return <ErrorState q={q} where={where} />;
  }

  if (!place) {
    return <WherePrompt q={q} notFound={placeText || undefined} />;
  }

  // ── fetch + rank real cafes ──
  let cafes;
  try {
    cafes = await cafesNear(roundCoord(place.lat), roundCoord(place.lng), Number(r));
  } catch {
    return <ErrorState q={q} where={where} />;
  }
  const withDistance = cafes.map((c) => ({ ...c, distanceKm: distanceKm(place.lat, place.lng, c.lat, c.lng) }));
  const { results: ranked, relaxed } = rankCafes(withDistance, it, nameWords);

  // ── sort / filter / view (all in the URL) ──
  const sort: SortKey = SORTS.find((s) => s.key === first(sp.sort))?.key ?? "match";
  const view = first(sp.view) === "map" ? "map" : "list";
  const active = new Set(
    first(sp.f)
      .split(",")
      .filter((k): k is FilterKey => FILTERS.some((f) => f.key === k)),
  );
  await connection(); // "open now" depends on the current time, so compute it per request
  const ctx: FilterCtx = { open: new Map(ranked.map((r) => [r.cafe.id, openState(r.cafe)])) };
  const passes = (c: Cafe, keys: Set<FilterKey>) => FILTERS.every((f) => !keys.has(f.key) || f.test(c, ctx));
  const stats = await cafeStatsSafe(ranked.map((r) => r.cafe.id));

  const results = sortResults(
    ranked.filter((r) => passes(r.cafe, active)),
    sort,
    stats,
  );
  const shown = results.slice(0, MAX_RESULTS);
  const viewer = await getCurrentUser().catch(() => null);
  const saved = await savedIdsSafe(viewer?.profile ? viewer.id : undefined, shown.map((r) => r.cafe.id));
  const hiddenNoHours = active.has("open") ? ranked.filter((r) => passes(r.cafe, new Set([...active].filter((k) => k !== "open"))) && ctx.open.get(r.cafe.id) === "unknown").length : 0;

  const fParam = (keys: Set<FilterKey>) => FILTERS.map((f) => f.key).filter((k) => keys.has(k)).join(",");
  const base: Partial<Params> = {
    q,
    where,
    lat: where ? "" : coords?.lat,
    lng: where ? "" : coords?.lng,
    sort: sort === "match" ? "" : sort,
    f: fParam(active),
    view: view === "map" ? "map" : "",
  };
  const toggled = (k: FilterKey) => {
    const next = new Set(active);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    return next;
  };
  const controls = {
    sort: SORTS.map((s) => ({ key: s.key, label: s.label, active: s.key === sort, href: buildHref({ ...base, r, sort: s.key === "match" ? "" : s.key }) })),
    view: [
      { key: "list", label: "▦ list", active: view === "list", href: buildHref({ ...base, r, view: "" }) },
      { key: "map", label: "⌖ map", active: view === "map", href: buildHref({ ...base, r, view: "map" }) },
    ],
    filters: FILTERS.map((f) => {
      const next = toggled(f.key);
      return {
        key: f.key,
        label: f.label,
        active: active.has(f.key),
        count: ranked.filter((r) => passes(r.cafe, active.has(f.key) ? active : next)).length,
        href: buildHref({ ...base, r, f: fParam(next) }),
      };
    }),
  };
  const pins: MapPin[] = shown.map(({ cafe }) => ({
    id: cafe.id,
    name: cafe.name,
    lat: cafe.lat,
    lng: cafe.lng,
    distance: formatDistance(cafe.distanceKm),
    avg: stats[cafe.id]?.reviews ? stats[cafe.id].avg : null,
    reviews: stats[cafe.id]?.reviews ?? 0,
    colour: ACCENT_HEX[cafe.accent],
  }));
  const understood = [...it.drinks.map((d) => DRINKS[d.id].name.toLowerCase()), ...it.vibes.map((v) => VIBES[v].label)];
  const fuzzy = it.drinks.filter((d) => d.kind !== "exact");
  const moodVibe = it.vibes.find((v) => moodPlaylist(MOOD_PLAYLISTS, v));

  return (
    <>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="font-serif text-2xl">{q ? "you searched for" : "browsing cafes"}</p>
          <h1 className="break-words font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.9]">
            {q ? <>&ldquo;{q}&rdquo;</> : "everything"}
          </h1>
          <p className="mt-2 font-label text-sm uppercase tracking-wider">
            📍 near {place.label}
          </p>
        </div>
        <SearchBar defaultQuery={q} defaultWhere={where} coords={where ? undefined : coords} radius={r} />
      </div>

      {understood.length > 0 && (
        <p className="mt-4 font-hand text-2xl">
          <Sparkle size={18} color="var(--color-hotpink)" className="mr-1 inline-block align-baseline" />
          we read that as: <span className="font-semibold">{understood.join(" + ")}</span>
          {fuzzy.length > 0 && (
            <span className="text-cola/75">
              {" "}
              (did you mean <i>{fuzzy.map((d) => DRINKS[d.id].name.toLowerCase()).join(", ")}</i>?)
            </span>
          )}
        </p>
      )}
      {moodVibe && (
        <SpotifyPlayer
          song={moodPlaylist(MOOD_PLAYLISTS, moodVibe)!}
          title={`the ${VIBES[moodVibe].label} playlist`}
          prefix="set the mood"
          className="mt-3 max-w-md"
        />
      )}

      <div className="mt-10">
        <FolderTabs
          label="How far to look"
          tabs={RADII.map((x) => ({ label: x.label, note: x.note, href: buildHref({ ...base, r: x.value }), active: x.value === r }))}
        />
        <section aria-live="polite" aria-label="Results" className="paper rounded-b-2xl border-2 border-t-0 border-cola/70 bg-cotton-deep/60 p-6 pt-8">
          <p className="sr-only">
            {results.length} {results.length === 1 ? "cafe" : "cafes"} found
          </p>
          {relaxed && (
            <p className="mb-6 rounded-xl border-2 border-dashed border-cola/50 bg-lemon/70 px-4 py-2 font-hand text-xl">
              couldn&apos;t spot {it.vibes.map((v) => VIBES[v].label).join(" + ")} clues in the map data here, so here&apos;s everything close by ✦
            </p>
          )}
          {ranked.length > 0 && <ResultControls {...controls} />}
          {hiddenNoHours > 0 && (
            <p className="mb-6 font-hand text-lg">
              ✦ {hiddenNoHours} {hiddenNoHours === 1 ? "cafe doesn't" : "cafes don't"} list opening hours on the map, so we hid {hiddenNoHours === 1 ? "it" : "them"}.
            </p>
          )}
          {shown.length > 0 ? (
            <>
              {view === "map" ? (
                <CafeMap pins={pins} centre={{ lat: place.lat, lng: place.lng, label: place.label }} />
              ) : (
                <div data-fx="rise" className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-3">
                  {shown.map((res, i) => (
                    <CafeIdCard key={res.cafe.id} cafe={res.cafe} reasons={q ? res.reasons : undefined} index={i} stats={stats[res.cafe.id]} saved={saved ? saved.has(res.cafe.id) : null} />
                  ))}
                </div>
              )}
              {results.length > shown.length && (
                <p className="mt-8 text-center font-hand text-xl">
                  showing the top {shown.length} of {results.length}. Add a drink, vibe or filter to narrow it down.
                </p>
              )}
            </>
          ) : active.size > 0 && ranked.length > 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <DrinkCup drink="americano" className="h-32 w-auto -rotate-12 opacity-80" />
              <h2 className="mt-4 font-display text-3xl">no cafes match all those filters</h2>
              <Link href={buildHref({ ...base, r, f: "" })} className="mt-4 font-hand text-2xl underline underline-offset-4">
                clear filters →
              </Link>
            </div>
          ) : (
            <EmptyState q={q} base={{ ...base, r }} suggestions={suggest(q)} widerHref={r !== "8" ? buildHref({ ...base, r: "8" }) : undefined} />
          )}
          <p className="mt-8 text-right text-xs text-cola/70">
            Cafe data ©{" "}
            <a href="https://www.openstreetmap.org/copyright" className="underline" target="_blank" rel="noopener noreferrer">
              OpenStreetMap contributors
            </a>
          </p>
        </section>
      </div>
    </>
  );
}

/* ───────────── states ───────────── */

function CityStickers({ q }: { q: string }) {
  const tilt = [-4, 3, -2, 5, -3, 2];
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {POPULAR_PLACES.map((p, i) => (
        <li key={p}>
          <Link
            href={buildHref({ q, where: p })}
            className="wiggle inline-block rounded-full border-2 border-cola bg-lemon px-4 py-1.5 text-sm font-semibold shadow-[2px_3px_0_var(--color-cola)] hover:bg-lime"
            style={{ "--r": `${tilt[i % tilt.length]}deg` } as React.CSSProperties}
          >
            {p.split(",")[0]}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** No location yet: ask where to look, keeping the drink/vibe they typed. */
function WherePrompt({ q, notFound }: { q: string; notFound?: string }) {
  return (
    <div className="mx-auto max-w-3xl py-6 text-center">
      <DrinkCup drink="iced-latte" className="mx-auto h-36 w-auto -rotate-6" />
      <h1 className="mt-4 font-display text-[clamp(2.5rem,6vw,4rem)] leading-none">where should we look?</h1>
      <p className="mx-auto mt-3 max-w-md text-lg">
        {notFound ? (
          <>We couldn&rsquo;t find a place called &ldquo;{notFound}&rdquo;. Try a city or neighbourhood.</>
        ) : (
          <>
            latteletters works anywhere in the world. Type a city or tap <b>near me</b>
            {q && (
              <>
                {" "}
                to find <b>{q}</b>
              </>
            )}
            .
          </>
        )}
      </p>
      <div className="mt-8 flex justify-center text-left">
        <SearchBar defaultQuery={q} />
      </div>
      <p className="mt-8 font-hand text-2xl">or pick a city:</p>
      <div className="flex justify-center">
        <CityStickers q={q} />
      </div>
    </div>
  );
}

function ErrorState({ q, where }: { q: string; where: string }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <DrinkCup drink="cold-brew" className="h-36 w-auto rotate-12" />
      <h1 className="mt-4 font-display text-4xl">the cafe map is a little busy</h1>
      <p className="mt-2 max-w-md">OpenStreetMap didn&rsquo;t answer in time. Give it a few seconds and try again.</p>
      <Link
        href={buildHref({ q, where })}
        className="mt-6 rounded-full border-2 border-cola bg-hotpink px-6 py-2 font-display shadow-[3px_3px_0_var(--color-cola)]"
      >
        try again
      </Link>
    </div>
  );
}

/** FR-6: friendly empty state that suggests similar drinks. */
function EmptyState({
  q,
  base,
  suggestions,
  widerHref,
}: {
  q: string;
  base: Partial<Params>;
  suggestions: DrinkId[];
  widerHref?: string;
}) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <DrinkCup drink="americano" className="h-36 w-auto -rotate-12 opacity-80" />
      <h2 className="mt-4 font-display text-3xl">no cafes found here… yet!</h2>
      <p className="mt-2 max-w-md">
        {q ? <>Nothing matched &ldquo;{q}&rdquo; in this area.</> : <>We couldn&rsquo;t find mapped cafes in this area.</>}{" "}
        {widerHref ? "Try looking further out, or one of these:" : "Try one of these:"}
      </p>
      {widerHref && (
        <Link href={widerHref} className="mt-4 font-hand text-2xl underline underline-offset-4">
          look up to 8 km away →
        </Link>
      )}
      <ul className="mt-5 flex flex-wrap justify-center gap-2">
        {suggestions.map((d) => (
          <li key={d}>
            <Link
              href={buildHref({ ...base, q: DRINKS[d].name.toLowerCase() })}
              className="wiggle inline-block rounded-full border-2 border-cola bg-lime px-4 py-1.5 font-semibold shadow-[2px_3px_0_var(--color-cola)]"
            >
              {DRINKS[d].name.toLowerCase()}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
