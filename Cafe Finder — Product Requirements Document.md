# latteletters (Cafe Finder): Product Requirements Document

**Author:** Nakshathra Naveen Nambiar · **Status:** v2, live · **Last updated:** 24 November 2026 (v1: 20 November 2026) · **Project type:** Portfolio web app (GitHub + CV) · **Region:** worldwide (detailed data for Canada and the US) · **Live:** [latteletters.vercel.app](https://latteletters.vercel.app)

> **What changed in v2:** the product is named and live, and it works anywhere in the world instead of only Waterloo Region. Cafe data now comes from open map data (Overture Maps + OpenStreetMap) instead of hand-curated seed data, with interactive maps. People can search for any cafe they visited and review it, add cafes that are missing, keep public or private cafe lists with what to order, share a go-to order receipt, find other people by username, and join private cafe crews. Search forgives typos, capitals, accents and spacing. Section 6 shows what has shipped and what's next.

## 1. Overview

latteletters is a whimsical, girly, scrapbook-style website that helps coffee lovers anywhere in the world discover cafes by **mood, vibe and drink** rather than just by distance. Users type how they feel ("cozy study spot") or a viral drink ("dirty chai", "matcha in tokyo"), and the site returns real cafes that match, explains why each one matched, and shows community reviews, love notes, what people order there and the cafe's social links.

It is also a small social space for cafe people: everyone gets a profile with a go-to order receipt, cafe lists, saved cafes and reviews, and friends can share cafes in private crews.

The product has two goals that carry equal weight:

1. **Product goal:** a genuinely delightful way to find cafes, and a free way to help small cafes grow through social exposure.
2. **Portfolio goal:** a polished, animated, well-documented build that shows full-stack and design ability on a GitHub repo and a CV.

## 2. Problem and Opportunity

- Existing cafe finders (Google Maps, Yelp) are utilitarian. They answer "what's close?" but not "what fits my mood?" or "who serves that TikTok drink?".
- Cafe-goers discover places through Instagram and TikTok, but there is no single place that connects a viral drink or vibe to real nearby cafes.
- Small, independent cafes are often missing or thin on free map data, and they have little reach.
- What people actually want to know about a cafe is often "what should I order there?", which star ratings don't answer.
- Almost every cafe finder looks the same. A distinctive, personal, whimsical brand is a real differentiator.

## 3. Target Users

| Persona | Needs |
| --- | --- |
| **The Explorer** (primary): students and young professionals, 17–30 | Find new cafes that match a vibe; study spots; aesthetic places for photos |
| **The Trend Chaser** | Saw a viral drink, wants to know who makes it near her |
| **The Local Regular** | Reviews cafes she's been to, shares favourite spots and what to order, adds small cafes the map is missing |
| **The Friend Group** | Shares a cafe list with friends and plans where to go next |
| **The Cafe Owner** (secondary) | Gets traffic to their Instagram and menu |

## 4. Goals and Non-Goals

**Goals**

- Search by drink name and by mood/vibe, anywhere in the world.
- Find any specific cafe by name, even with typos, and review it.
- Let the community add cafes that are missing, permanently.
- Cafe pages with reviews, love notes, social links, maps and "what people order here".
- User accounts with profiles, go-to orders, lists, saved cafes and crews.
- Scroll-triggered animation and a distinctive whimsical visual identity.
- Deployed publicly, with a clean README suitable for a CV.
- Stay free to run (free tiers of Vercel and Supabase, free open map data).

**Non-goals (for now)**

- Online ordering, payments or reservations.
- Cafe-owner dashboard or claim-your-listing flow (future).
- Native mobile apps (the site is mobile-responsive).
- Paid map or places APIs (Google Places etc.).
- Following people or a social feed.

## 5. Success Metrics

| Metric | Target (first 3 months) | Status |
| --- | --- | --- |
| Cafes listed | 50+ in Waterloo Region, then Toronto | **Exceeded:** ~165,000 in Canada and the US, plus OpenStreetMap worldwide |
| Searches completed with at least one result | 90% | |
| "Find the cafe you went to" finds the right cafe (with a location or city, typos included) | 90% in the top 15 | **85–100%** in testing on random real cafes |
| Cafe pages with at least one social link click | 25% of visits | Click tracking in place |
| User reviews posted | 100+ | |
| Community-added cafes | 50+ | |
| Public cafe lists | 25+ | |
| Lighthouse performance / accessibility | 85+ / 90+ | |
| Portfolio | Public repo, live demo link, README with screenshots | Repo and live link done; screenshots to do |

## 6. Scope and Phasing

### Phase 1: MVP ✅ shipped

- Search bar with drink-name search (alias dictionary, misspellings) that lists matching cafes near the user.
- Cafe cards and cafe detail pages.
- Landing page with scroll animations and full visual identity.
- Social links per cafe.
- ~~Hand-curated seed data~~ replaced by real map data (see 7.6).

### Phase 2 ✅ shipped

- Passwordless accounts, profiles and cup avatars.
- Reviews and love notes with photos and music.
- Geolocation, distance picker and sorting; interactive map view.
- Filters: open now, vegan, wifi, outdoor seating, independent.

### Phase 3 ✅ mostly shipped

- Mood/vibe search with "why this matched".
- Saved cafes and cafe crews.
- **Added in v2:** find-and-review any cafe, community-added cafes, cafe lists, go-to orders, people search, forgiving name search.
- Cafe-owner claim flow: not started.

### Phase 4: next

- **Worldwide detailed cafe data (planned for the weekend of 28–29 November 2026):** move the ~1.5M worldwide Overture cafes out of the database into static map files served from Vercel's CDN, with a name-search index split into small files. Keeps it free and fast, and leaves Supabase for user data only. (Alternative considered: Supabase Pro at $25/month.)
- Screenshots and demo GIF for the README.
- Cafe-owner claim or correction flow.

> **Decision (v1, kept):** build the MVP first and treat vibe search as an upgrade on the same tag system. **Decision (v2):** use free open map data (Overture + OpenStreetMap) instead of hand-curated listings or Google Places.

## 7. Functional Requirements

### 7.1 Search by drink and mood ✅

- **FR-1** A prominent search bar on the landing page and in the header.
- **FR-2** Typing a drink name (including viral drinks and common misspellings) returns cafes that serve it, using a drink alias dictionary (e.g. "whipped coffee" → dalgona, "boba" → bubble tea).
- **FR-3** The location comes from the query ("matcha in tokyo"), a typed city or neighbourhood anywhere in the world, or the browser's location (rounded to ~110 m, never stored). Distance picker: walkable (1 km), short ride (3 km), worth the trip (8 km).
- **FR-4** Quick-pick mood and drink chips below the search bar.
- **FR-5** Mood/vibe queries map to vibe tags inferred from real map data (wifi, outdoor seating, opening hours, independent vs chain, cuisine). Each result shows "why this matched".
- **FR-6** Friendly empty state when nothing matches.
- **FR-6a** Sort by best match, closest or top rated. Filter by open now (in the cafe's own time zone), vegan, wifi, outdoor seating or independent, with live counts. All state lives in the URL, so results are shareable and work without JavaScript.
- **FR-6b** List and map views. The map shows cup-shaped pins that group into numbered bubbles in busy areas.

### 7.2 Find a cafe you visited and review it ✅ (new in v2)

- **FR-20** `/find`: search any cafe by name as you type, then open it and leave a review, with no need to browse for it first.
- **FR-21** Name search must forgive mistakes. A cafe the user means must still show up for:
  - any capitals ("sTarBucks"), accents ("LÀ LÁ" / "la la") and punctuation
  - missing or extra spaces ("lalabakeshop", "la la bakeshop", "bake shop")
  - typos, including a typo in every word ("lala bakshop", "pilot cofee")
  - It must not hide results until the name is typed exactly.
- **FR-22** When the user's location or a city is known, nearby matches rank first (e.g. "starbucks" shows the Starbucks near you, not a random one). Clearly better name matches still win.
- **FR-23** Results combine community cafes, Overture cafes and OpenStreetMap (Photon, with Nominatim as a fallback when Photon is down), with the same cafe from two sources shown only once so its reviews aren't split.

### 7.3 Cafe detail page ✅

- **FR-7** Name, address, neighbourhood, opening hours, amenities, vibe tags.
- **FR-8** Photo gallery from reviews (polaroid style).
- **FR-9** Menu or website link where known.
- **FR-10** Social block (Instagram, website and other links) opening in a new tab, with click-through tracking.
- **FR-11** Map pin, "get directions" link, and "edit on OpenStreetMap" for corrections.
- **FR-11a** Average stars and love-note count, also shown on cafe cards.
- **FR-11b** "What people order here", from public cafe lists.
- **FR-11c** Add to a list, save (♡), or share with a crew from the cafe page.

### 7.4 Reviews and love notes ✅

- **FR-12** Logged-in users can post a review: star rating, drink ordered, vibe tags, text, up to 3 photos and an optional Spotify song ("what was playing?").
- **FR-13** A short "love note" shown as a sticky-note card.
- **FR-14** Users can edit and delete their own posts, and report others'.
- **FR-15** Moderation:
  - a profanity filter that catches l33t-speak
  - rate limits: 5 posts an hour, 1 review per cafe, 3 notes per cafe a day
  - auto-hide after 2 reports
  - an admin review queue

### 7.5 Accounts and profiles ✅

- **FR-16** Passwordless login with an emailed one-time link. Pick a username and design a cup avatar. Public profile at `/u/<username>` with a "regular" badge and review history. "Delete my account" removes every post and photo.
- **FR-17** Saved cafes (♡), visible only to the owner.
- **FR-24 (new)** **Go-to order receipt:** every user can fill in drink, size, milk, sweetness, temperature, extras and notes in settings, with a live preview. It shows on their profile as the same receipt the creator page uses.
- **FR-25 (new)** **Find people** (`/people`): search users by username.
- **FR-26 (new)** **Cafe crews:** private friend groups with a shared cafe list.
  - Join by invite link, or accept or decline an add-by-username invite.
  - Members add cafes with a short note and heart each other's picks.
  - Non-members get a 404.

### 7.6 Cafe lists ✅ (new in v2)

- **FR-27** Users can make as many lists as they like (e.g. "best study spots in Toronto"), each with a title and description.
- **FR-28** Each list is **private or public**, chosen by the user. Lists are private by default.
- **FR-29** Each cafe in a list has a "what to order" recommendation and a note, both editable, and can be removed.
- **FR-30** Public lists show on the owner's profile. Private lists are only visible to the owner, and only the server reads them.

### 7.7 Community-added cafes ✅ (new in v2)

- **FR-31** `/add-cafe`: if a cafe isn't listed, a logged-in user adds it with a name, kind (cafe, coffee shop, boba, tea room, bakery…) and a pin they drag into place. The address is filled in automatically. Then they write the first review.
- **FR-32** Added cafes appear in search and on the map for everyone, and **stay permanently**, even if the account that added them is deleted.
- **FR-33** Safeguards:
  - a duplicate check against nearby cafes with a similar name
  - the profanity filter
  - a limit of 5 added cafes a day per person
  - 3 reports hide a cafe until an admin reviews it

### 7.8 Cafe data ✅ (rewritten in v2)

- **FR-18** Cafe records come from three sources, identified by id prefix:
  - **Overture Maps** (`o-<uuid>`): ~165,000 cafes, coffee shops, boba shops and tea rooms in Canada and the US, imported into Supabase. That's about 8× more cafes than OpenStreetMap alone in downtown Toronto, including small ones. Licences: CDLA-Permissive-2.0 / Apache-2.0 / CC0, credited in the footer.
  - **OpenStreetMap** (`node-` / `way-` / `relation-<id>`): live from Nominatim (area search, geocoding, lookups) and Photon (name search) everywhere else in the world, and as a fallback.
  - **Community** (`c-<uuid>`): cafes added by users.
- **FR-19** Refresh: Overture publishes monthly. `scripts/overture/import.mjs --countries CA,US` refreshes the data in about 10 minutes. It writes rows in map order, skips unchanged rows, removes closed cafes, and stops before the database reaches 460 MB (the free plan's limit is 500 MB). No scraping. Each source's terms are respected.

## 8. Design Requirements

### 8.1 Brand direction: "Whimsical scrapbook cafe"

Cute, girly, personal and a bit surreal, like a creative portfolio crossed with a zine. It should feel hand-made, not like a template.

### 8.2 Palette (from the inspo board)

| Name | Hex | Use |
| --- | --- | --- |
| Cotton Candy | `#FFD7E7` | Primary background and cards |
| Cherry Cola | `#47131C` | Primary text, headings, dark sections |
| Lemon Soda | `#FFFDE9` | Secondary background, seasonal accents |
| Hot pink | approx. `#F08CB8` | Big display type, buttons |
| Neon lime | approx. `#D4F31E` | Sticker accents and badges (sparingly) |
| Lavender, olive | approx. `#B9A9E8`, `#9AAE3E` | Occasional tab and sparkle accents |

Maps are recoloured to the same pinks.

### 8.3 Typography

- **Display:** oversized, tight, bold grotesque or sans for hero words, repeated and layered behind imagery.
- **Accent:** elegant italic serif or script for captions and flourishes.
- **Handwritten:** a marker or handwriting font for annotations, arrows and circled words.
- **Body:** clean sans for readability.

### 8.4 Visual language and signature components

- **Folder-tab navigation:** textured stacked folders (mood folders on the home page, the distance picker).
- **Lace borders:** scalloped lace dividers between sections and around cards.
- **Badge or ID card:** each cafe has a "cafe ID" card; reviewers get a "regular" badge.
- **Receipts:** go-to orders shown as a printed cafe receipt.
- **Collage and cut-outs:** drink photos as cut-outs with sticker labels.
- **Polaroid, photobooth strips and tape:** gallery, review cards and "how it works".
- **Metallic stars and sparkles:** floating decorative elements.
- **Handwritten annotations:** doodled arrows and circled words around the search bar.
- **The letter:** the home page opens with a handwritten letter from the creator.
- **Paper texture and slight grain** across backgrounds.

### 8.5 Motion (scroll-triggered)

| Section | Animation |
| --- | --- |
| **Hero** | Parallax; large words stagger in; search bar bounces in last |
| **Mood chips** | Pop in like stickers with a slight rotation; hover wiggle |
| **Mood folders** | Folders file into place as you scroll |
| **How it works** | Three polaroid steps pinned one by one |
| **Ribbon / drip line** | Ribbon slides; drip line draws itself |
| **Results grid** | Cards rise and settle with stagger |
| **Reviews** | Sticky notes drop in at slight angles |
| **Lace dividers** | Draw in from left to right |

Rules: animation must respect `prefers-reduced-motion`, stay within a ~60fps budget on mid-range phones, and never block content or search.

### 8.6 Accessibility

- WCAG AA contrast (check pink-on-pink and lime combinations).
- Full keyboard navigation, skip link, visible focus states, alt text on all images, ARIA labels on custom controls (map pins, pin picker, list controls).
- Decorative elements marked as presentational.
- Search is a plain GET form, so it works before JavaScript loads.

## 9. Technical Approach (as built)

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js 16 (App Router, Cache Components, Turbopack) + React 19 + TypeScript + Tailwind CSS v4 | Deployable, widely recognised on CVs |
| Animation | GSAP + ScrollTrigger | Scroll-triggered effects, stagger, SVG draw |
| Backend / DB | Supabase (Postgres with row level security, Auth magic links, Storage) | Accounts, reviews, lists, images in one free service |
| Writes | Next.js Server Actions with the service role, after session, validation, profanity and rate-limit checks | Nobody can skip the checks by calling Supabase directly |
| Cafe data | Overture Maps places (read with DuckDB, imported into Supabase), OpenStreetMap via Nominatim and Photon | Free, worldwide, includes small cafes |
| Maps | MapLibre GL JS + OpenFreeMap vector tiles | Free, no API key, restylable |
| Search | Drink/vibe alias dictionary + Levenshtein fuzzy matching. Name search uses a Postgres full-text index (prefix + split-word + nearby-first queries, plus a 2–3-letter typo pass), then typo-tolerant ranking in the app (`src/lib/match.ts`) | Forgiving and free; no search service needed |
| Caching | `use cache` + `cacheTag` / `updateTag`; failures never cached | Fast pages, instant updates after posting |
| Hosting | Vercel (auto-deploys from `main`) | Free tier, CI from GitHub |
| Repo | GitHub with README and live link | Portfolio value |

**Ranking sketch (as built):** drink fit (name match > cuisine > "coffee shop") + vibe matches + small boost for independents, ties broken by distance. Name search: a clearly better name match wins; close calls go to the nearer cafe, then the more trusted source (community > Overture > OpenStreetMap).

## 10. Content, Legal and Privacy

- Cafe data: open data only (Overture, OpenStreetMap), with attribution. Corrections go to OpenStreetMap through an "edit on OpenStreetMap" link.
- User content: report buttons, auto-hide thresholds, admin queue and takedown process for posts and community cafes.
- Privacy (following PIPEDA principles):
  - collect minimal data (email, username)
  - emails are never shown
  - location is rounded and never stored
  - photo EXIF/GPS data is stripped in the browser
  - saved cafes, private lists and crews are server-only (RLS on with no public policies)
  - account deletion removes posts and photos
- Spotify players load only when someone presses play, so no Spotify cookies are set until then.
- Social links open externally; no scraping of social platforms.

## 11. Milestones

| Phase | Deliverable | Status |
| --- | --- | --- |
| 0 | Design system: palette, type, folder/lace/badge components | ✅ Done |
| 1 | MVP: landing, drink search, cafe pages, animations, deploy | ✅ Done |
| 2 | Accounts, reviews, geolocation and map, filters | ✅ Done |
| 3 | Vibe search, saved cafes, crews | ✅ Done |
| 3b | Open map data, find-and-review, community cafes, lists, go-to orders, people search, forgiving search | ✅ Done (24 Nov 2026) |
| 4 | Worldwide detailed cafe data via static map files | Planned: weekend of 28–29 Nov 2026 |
| Polish | README screenshots, case study, demo GIF, CV bullet | To do |

## 12. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| ~~Not enough cafe data~~ | Solved with Overture + OpenStreetMap + community-added cafes |
| Free database too small or slow for worldwide data (1.5M cafes caused two short outages on 24 Nov 2026) | Detailed data limited to Canada and the US for now (53 MB); database lookups time out after 5 s and fall back to OpenStreetMap; worldwide data moving to static files (Phase 4) |
| Free public map services are rate-limited or go down (Overpass blocked; Photon unavailable at times) | Overpass removed; Nominatim fallback for name search; results cached for days; failures never cached |
| Over-scoped | Strict phasing |
| Heavy animation hurts performance | Lazy-load, compress images, reduced-motion fallback; map worker loaded only on map view |
| Fake or abusive reviews or cafes | Auth required, rate limits, profanity filter, reports with auto-hide, moderation queue |
| Photo and copyright issues | Only user-uploaded photos; takedown process |
| Maps API costs | Free stack only (MapLibre, OpenFreeMap, Overture, OpenStreetMap) |

## 13. Open Questions

Resolved in v2:

1. ~~Site name and logo?~~ **latteletters.**
2. ~~Which cities after Waterloo Region?~~ **Everywhere:** detailed data for Canada and the US, OpenStreetMap elsewhere, worldwide detailed data next.
3. ~~Google Places vs hand-curated?~~ **Neither:** free open map data plus community-added cafes.
4. ~~Cafe owner contact form?~~ Corrections go through OpenStreetMap for now; a claim flow is future work.
5. ~~Anonymous testimonies?~~ **Account required** for all posts, lists and added cafes.

Still open:

1. Worldwide data: static files on Vercel (free, planned) or Supabase Pro ($25/month)?
2. Should crews and lists support collaborative editing between friends?
3. Should community-added cafes be offered back to OpenStreetMap?

## 14. CV Framing (draft bullet)

*Designed and built latteletters, a full-stack, worldwide cafe discovery web app with mood- and drink-based search, typo-tolerant search over 165k+ cafes from open map data, community-added cafes, public/private cafe lists, user reviews and scroll-driven animations. Deployed on Vercel with a Supabase (Postgres, RLS) backend and MapLibre maps.*
