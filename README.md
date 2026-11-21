# latteletters ✦

**A scrapbook-style cafe finder for anywhere in the world. Search by the drink you're craving or the mood you're in.**

Type `matcha in tokyo`, `boba` + Toronto, or `cozy study spot` and tap **near me**. latteletters finds real cafes nearby and explains *why* each one matched.

**🔗 Live site: [latteletters.vercel.app](https://latteletters.vercel.app)**

<!-- TODO: add screenshots / demo GIF -->

## Features

- **Works worldwide**: live cafe data from OpenStreetMap. Type any city or neighbourhood, or use your location (rounded to ~110 m, never stored).
- **Drink search with an alias dictionary**: viral names, nicknames and misspellings resolve to the right drink (`whipped coffee` → dalgona, `capuccino` → cappuccino, `boba` → bubble tea).
- **Mood and vibe search**: phrases like `late night` or `cozy study` map to vibe tags inferred from real map data (wifi, outdoor seating, opening hours, independent vs chain, Instagram, cuisine).
- **"Why this matched"** on every result ("has wifi", "open late", "tea spot"), plus a friendly empty state.
- **Folder-tab distance picker**: walkable (1 km), short ride (3 km), worth the trip (8 km).
- **Cafe pages**: ID card with address and opening hours, amenities, social links with click tracking, an OpenStreetMap embed, directions, and an "edit on OpenStreetMap" link for corrections.
- **Meet the creator** page with an envelope infographic, photobooth strip and go-to-order receipt.
- **Scroll-driven motion** (GSAP ScrollTrigger): parallax hero, sliding ribbon, a drip line that draws itself, mood folders that file into place.
- **Accessible**: respects `prefers-reduced-motion`, keyboard navigation and a skip link, visible focus styles, ARIA labels. Search is a plain GET form, so it works before JS loads.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components, Turbopack) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 with design tokens in `globals.css`; custom display fonts via `next/font/local` |
| Motion | GSAP + ScrollTrigger |
| Data | OpenStreetMap via the Nominatim API, cached with `use cache` (Supabase planned for accounts & reviews) |
| Maps | OpenStreetMap embed (free, no API key) |
| Hosting | Vercel |

## How search works

1. **Understand the query** (`src/lib/search.ts`): greedy longest-phrase matching against drink aliases and vibe synonyms, then Levenshtein fuzzy matching for typos and prefix matching for half-typed words. Words after "in"/"near", or any it can't place, become the location (`matcha in tokyo`).
2. **Find the place**: Nominatim geocodes the city, or the browser's rounded location is used.
3. **Fetch real cafes** (`src/lib/osm.ts`): Nominatim `amenity=cafe` search inside a box around the point. Results are cached for a day, requests are throttled to 1 per second per the usage policy, and failures are never cached.
4. **Infer vibes** (`src/lib/vibes.ts`): each mood is a transparent rule over real tags. For example, `study` means wifi or a bookish name, and `late-night` means it closes after 9pm.
5. **Rank**: drink fit (a name match beats the cuisine type, which beats "coffee shop"), plus vibe matches and a small boost for independent cafes. Ties are broken by distance.

## Project structure

```
src/
  app/
    page.tsx              landing page
    search/page.tsx       results (searchParams streamed inside <Suspense>)
    cafe/[id]/page.tsx    cafe detail, e.g. /cafe/node-123456
    about/page.tsx        meet the creator
    api/track/route.ts    social click-through events
  components/             ID card, folder tabs, mood folders, polaroids, lace, ScrollFx…
  data/                   creator page + "how it works" content (edit these!)
  lib/                    osm (data), search, drinks (alias dictionary), vibes (rules), places
  fonts/                  custom display fonts
```

## Running locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
```

## Data & corrections

Cafe data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the ODbL. Anyone can fix a listing (hours, Instagram, closed cafes) on OpenStreetMap, and latteletters picks up the change within a day.

## Roadmap

- **Phase 2**: accounts (Supabase Auth), reviews and love notes with photos, a map view, filters (open now, vegan).
- **Phase 3**: weighted vibe search using review text, saved cafes ("coffee passport"), a cafe-owner claim flow.

---

Designed & built by Nakshathra Nambiar.
