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
- **Accounts (passwordless)**: log in with an emailed one-time link, then pick a username and a drink-cup avatar. Public profiles live at `/u/<username>` with a "regular" badge. "Delete my account" removes every post and photo.
- **Reviews & love notes**: a star rating, the drink you ordered, vibe tags and up to 3 photos, or a short sticky-note "love note". You can edit and delete your own, and they appear instantly thanks to tag-based cache invalidation.
- **Private by default**: photos are resized in the browser before upload, which strips EXIF/GPS metadata. Emails are never shown.
- **Moderation**:
  - a profanity filter that also catches l33t-speak
  - rate limits: 5 posts an hour, 1 review per cafe, 3 notes per cafe a day
  - one-click reports that auto-hide a post after 2 reports
  - an admin review queue
- **Meet the creator** page with an envelope infographic, photobooth strip and go-to-order receipt.
- **Scroll-driven motion** (GSAP ScrollTrigger): parallax hero, sliding ribbon, a drip line that draws itself, mood folders that file into place.
- **Accessible**: respects `prefers-reduced-motion`, keyboard navigation and a skip link, visible focus styles, ARIA labels. Search is a plain GET form, so it works before JS loads.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components, Turbopack) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 with design tokens in `globals.css`; custom display fonts via `next/font/local` |
| Motion | GSAP + ScrollTrigger |
| Data | OpenStreetMap via the Nominatim API, cached with `use cache` |
| Accounts & reviews | Supabase (Postgres with row level security, Auth magic links, Storage) |
| Site images | Vercel Blob |
| Maps | OpenStreetMap embed (free, no API key) |
| Hosting | Vercel |

## How search works

1. **Understand the query** (`src/lib/search.ts`): greedy longest-phrase matching against drink aliases and vibe synonyms, then Levenshtein fuzzy matching for typos and prefix matching for half-typed words. Words after "in"/"near", or any it can't place, become the location (`matcha in tokyo`).
2. **Find the place**: Nominatim geocodes the city, or the browser's rounded location is used.
3. **Fetch real cafes** (`src/lib/osm.ts`): Nominatim `amenity=cafe` search inside a box around the point. Results are cached for a day, requests are throttled to 1 per second per the usage policy, and failures are never cached.
4. **Infer vibes** (`src/lib/vibes.ts`): each mood is a transparent rule over real tags. For example, `study` means wifi or a bookish name, and `late-night` means it closes after 9pm.
5. **Rank**: drink fit (a name match beats the cuisine type, which beats "coffee shop"), plus vibe matches and a small boost for independent cafes. Ties are broken by distance.

## How accounts & reviews work

- **Reads are public, writes are server-only.**
  - Postgres row level security lets the public key read only *visible* posts and public profile columns.
  - Every write goes through a Next.js Server Action (`src/app/actions/`). It checks the session, validates the input, and runs the profanity filter and rate limits. Only then does it write, using the service role.
  - So nobody can skip the checks by calling Supabase directly.
- **Photos**: the browser first shrinks each one to at most 1600px WebP. It then uploads straight to Supabase Storage through a one-time signed URL that the server issues.
- **Caching**: each cafe's wall is cached with `use cache` + `cacheTag("posts:<cafeId>")`. Actions call `updateTag`, so a new post shows up immediately. Login state is read per request inside `<Suspense>`, so pages keep their static shell.
- **Reports**: a Postgres trigger counts reports and hides a post at 2. It stays hidden until an admin approves or removes it at `/admin`.
- **Database setup**: the schema and policies live in `supabase/migrations/`. Apply them with `node --env-file=.env.local scripts/db-migrate.mjs`.

## Project structure

```
src/
  app/
    page.tsx              landing page
    search/page.tsx       results (searchParams streamed inside <Suspense>)
    cafe/[id]/page.tsx    cafe detail, e.g. /cafe/node-123456
    about/page.tsx        meet the creator
    api/track/route.ts    social click-through events
    actions/              server actions: posts, profile, admin, login
    auth/confirm/         verifies the emailed login link
    login, welcome, settings, u/[username], admin, privacy
  components/             ID card, folder tabs, mood folders, polaroids, lace, notes wall, post form…
  data/                   creator page + "how it works" content (edit these!)
  lib/                    osm (data), search, drinks (alias dictionary), vibes (rules), places,
                          auth (session), posts (reviews data), moderation, supabase/ clients
  fonts/                  custom display fonts
supabase/migrations/      database schema + row level security
```

## Running locally

```bash
npm install
npx vercel env pull .env.local   # Supabase + Blob keys
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
```

## Data & corrections

Cafe data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the ODbL. Anyone can fix a listing (hours, Instagram, closed cafes) on OpenStreetMap, and latteletters picks up the change within a day.

## Roadmap

- **Phase 2**: ✓ accounts, reviews and love notes with photos, moderation. Next up: a map view, distance sorting, and filters (open now, vegan).
- **Phase 3**: weighted vibe search using review text, saved cafes ("coffee passport"), a cafe-owner claim flow.

---

Designed & built by Nakshathra Nambiar.
