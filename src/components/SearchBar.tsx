/**
 * Search bar (FR-1). A plain GET form to /search, so it works before JS
 * loads and gives shareable URLs like /search?q=matcha&where=Tokyo.
 *
 *  - hero:    "what" + "where" boxes + near-me button
 *  - compact: one box for the header ("matcha in tokyo" works too)
 *  - place:   "anywhere else?" city box under the passport stamps
 */
import { NearMeButton } from "./NearMeButton";

const SearchIcon = ({ className }: { className: string }) => (
  <svg aria-hidden viewBox="0 0 24 24" className={className}>
    <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
    <path d="M15.5 15.5 L21 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export function SearchBar({
  variant = "hero",
  defaultQuery = "",
  defaultWhere = "",
  coords,
  radius,
}: {
  variant?: "hero" | "compact" | "place";
  defaultQuery?: string;
  defaultWhere?: string;
  /** keep searching around the visitor's (rounded) location if no city is typed */
  coords?: { lat: string; lng: string };
  radius?: string;
}) {
  if (variant === "place") {
    return (
      <form action="/search" method="get" role="search" className="w-full max-w-xl">
        <label htmlFor="search-place" className="font-hand text-2xl leading-tight">
          not on the wall? the whole world&rsquo;s on the map, just type it ✦
        </label>
        <div className="mt-3 flex items-center gap-2 rounded-full border-[3px] border-dashed border-cola bg-lemon p-1.5 pl-4 shadow-[4px_4px_0_var(--color-cola)]">
          <span aria-hidden className="shrink-0 text-xl">
            📍
          </span>
          <input
            id="search-place"
            name="where"
            type="search"
            required
            autoComplete="off"
            placeholder="lisbon, nairobi, your hometown…"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-base text-cola placeholder:text-cola/55 focus:outline-none sm:text-lg"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full border-2 border-cola bg-hotpink px-4 py-1.5 font-display text-sm text-cola transition hover:bg-cola hover:text-cotton sm:text-base"
          >
            stamp it ✈
          </button>
        </div>
      </form>
    );
  }

  if (variant === "compact") {
    return (
      <form action="/search" method="get" role="search" className="w-full max-w-xs">
        <label htmlFor="search-compact" className="sr-only">
          Search for a drink, vibe or place
        </label>
        <div className="flex items-center gap-2 rounded-full border-[3px] border-cola bg-lemon p-1 pl-4 shadow-[3px_3px_0_var(--color-cola)]">
          <SearchIcon className="size-4 shrink-0" />
          <input
            id="search-compact"
            name="q"
            type="search"
            autoComplete="off"
            placeholder="matcha in tokyo…"
            className="min-w-0 flex-1 bg-transparent py-1 text-sm text-cola placeholder:text-cola/55 focus:outline-none"
          />
          <button type="submit" className="shrink-0 rounded-full bg-hotpink px-3 py-1 font-display text-sm text-cola transition hover:bg-cola hover:text-cotton">
            go
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action="/search" method="get" role="search" className="w-full max-w-2xl">
      <div className="flex flex-col gap-2 rounded-[2rem] border-[3px] border-cola bg-lemon p-2 shadow-[6px_7px_0_var(--color-cola)] sm:flex-row sm:items-center sm:rounded-full">
        <div className="flex min-w-0 flex-[1.3] items-center gap-2 pl-4">
          <SearchIcon className="size-6 shrink-0" />
          <label htmlFor="search-q" className="sr-only">
            What are you craving? A drink or a vibe
          </label>
          <input
            id="search-q"
            name="q"
            type="search"
            defaultValue={defaultQuery}
            autoComplete="off"
            placeholder="dirty chai, cozy study spot…"
            className="min-w-0 flex-1 bg-transparent py-2 text-lg text-cola placeholder:text-cola/55 focus:outline-none"
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 border-t-2 border-dashed border-cola/30 pl-4 pt-2 sm:border-l-2 sm:border-t-0 sm:pt-0">
          <span aria-hidden className="text-lg">
            📍
          </span>
          <label htmlFor="search-where" className="sr-only">
            Where? A city or neighbourhood
          </label>
          <input
            id="search-where"
            name="where"
            type="text"
            defaultValue={defaultWhere}
            autoComplete="off"
            placeholder={coords ? "near you" : "any city…"}
            className="min-w-0 flex-1 bg-transparent py-2 text-lg text-cola placeholder:text-cola/55 focus:outline-none"
          />
        </div>
        {coords && (
          <>
            <input type="hidden" name="lat" value={coords.lat} />
            <input type="hidden" name="lng" value={coords.lng} />
          </>
        )}
        {radius && <input type="hidden" name="r" value={radius} />}
        <button
          type="submit"
          className="shrink-0 rounded-full bg-hotpink px-6 py-3 font-display text-lg text-cola transition hover:-translate-y-0.5 hover:bg-cola hover:text-cotton"
        >
          find my cafe
        </button>
      </div>
      <div className="mt-3 flex items-start gap-3 pl-2">
        <NearMeButton radius={radius} />
      </div>
    </form>
  );
}
