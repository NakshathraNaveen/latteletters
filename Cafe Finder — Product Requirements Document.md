# Cafe Finder — Product Requirements Document

**Author:** Nakshathra Naveen Nambiar · **Status:** Draft v1 · **Date:** 20 November 2026 **Project type:** Portfolio web app (GitHub + CV) · **Region:** Canada

## 1. Overview

Cafe Finder is a whimsical, girly, scrapbook-style website that helps coffee lovers across Canada discover cafes by **mood, vibe and drink** rather than just by distance. Users can type how they feel ("cozy rainy-day study") or a viral drink ("dirty chai", "iced pistachio latte"), and the site returns cafes that match, with photos, menus, community reviews and the cafe's social handles.

The product has two goals that carry equal weight:

1. **Product goal:** a genuinely delightful way to find cafes, and a free way to help small cafes grow through social exposure.
2. **Portfolio goal:** a polished, animated, well-documented build that shows full-stack and design ability on a GitHub repo and a CV.

## 2. Problem and Opportunity

- Existing cafe finders (Google Maps, Yelp) are utilitarian. They answer "what's close?" but not "what fits my mood?" or "who serves that TikTok drink?".
- Cafe-goers discover places through Instagram and TikTok, but there is no single place that connects a viral drink or vibe to real nearby cafes.
- Independent cafes want social growth but have little reach.
- Almost every cafe finder looks the same. A distinctive, personal, whimsical brand is a real differentiator.

## 3. Target Users

| Persona | Needs |
| --- | --- |
| **The Explorer** (primary): students and young professionals, 17–30 | Find new cafes that match a vibe; study spots; aesthetic places for photos |
| **The Trend Chaser** | Saw a viral drink, wants to know who makes it near her |
| **The Local Regular** | Leaves reviews, shares favourite spots |
| **The Cafe Owner** (secondary) | Gets traffic to their Instagram and menu |

## 4. Goals and Non-Goals

**Goals**

- Search by drink name (MVP) and by mood/vibe (V1).
- Cafe detail pages with photo gallery, menu, social links and reviews.
- User accounts with reviews and testimonies.
- Scroll-triggered animation and a distinctive whimsical visual identity.
- Deployed publicly, with a clean README suitable for a CV.

**Non-goals (for now)**

- Online ordering, payments or reservations.
- Cafe-owner dashboard or claim-your-listing flow (future).
- Native mobile apps (the site must be mobile-responsive, though).
- Coverage of all of Canada at launch. Start with Waterloo Region, then expand.

## 5. Success Metrics

| Metric | Target (first 3 months) |
| --- | --- |
| Cafes listed | 50+ in Waterloo Region / KW, then Toronto |
| Searches completed with at least one result | 90% |
| Cafe pages with at least one social link click | 25% of visits |
| User reviews posted | 100+ |
| Lighthouse performance / accessibility | 85+ / 90+ |
| Portfolio | Public repo, live demo link, README with screenshots |

## 6. Scope and Phasing

### MVP (Phase 1) — the simple, finishable version

- Search bar with **coffee/drink-name search** that lists matching cafes near the user.
- Cafe listing cards and a cafe detail modal or page.
- Hand-curated seed data for 20–30 cafes.
- Landing page with scroll animations and full visual identity.
- Social links per cafe.

### Phase 2

- User accounts (sign up/log in) and reviews/testimonies with photos.
- Geolocation and distance sorting; map view.
- Filters: city, price, open now, study-friendly, vegan options.

### Phase 3 — the "smart" search

- **Mood/vibe search:** free-text input ("quiet, matcha, good for studying") matched to cafe tags.
- Personalized ranking and saved favourites ("my coffee passport").
- Cafe-owner claim flow.

> **Decision:** Build MVP first. Treat vibe search as an upgrade built on the same tag system, not a blocker.

## 7. Functional Requirements

### 7.1 Search

- **FR-1** A prominent search bar on the landing page and in the header.
- **FR-2** Typing a drink name (including viral drinks and common misspellings) returns cafes that serve it. Use a drink alias dictionary (e.g. "dalgona", "whipped coffee").
- **FR-3** Results sorted by distance when location is granted, otherwise by city selection.
- **FR-4** Quick-pick chips below the search bar: mood chips (cozy, study, date, aesthetic, aesthetic-but-quiet) and drink chips (iced latte, matcha, cold brew).
- **FR-5 (Phase 3)** Mood/vibe query parsed into tags. Approach: keyword and tag scoring first (weighted match of query terms to cafe tags). Optional later: embedding-based semantic search. Show "why this matched" on each result.
- **FR-6** Friendly empty state when nothing matches, suggesting similar drinks.

### 7.2 Cafe detail page

- **FR-7** Name, neighbourhood, address, hours, price range, vibe tags, signature drinks.
- **FR-8** Photo gallery (scrapbook/polaroid style) that opens on click.
- **FR-9** Menu: link out to the cafe's menu, plus an in-page highlights list (signature drinks with prices where known).
- **FR-10** Social block: Instagram handle, plus TikTok, Facebook, website and other links, each opening in a new tab. Track click-throughs.
- **FR-11** Map pin and "get directions" link.

### 7.3 Reviews and testimonies

- **FR-12** Logged-in users can post a review: star rating, drink ordered, vibe tags, text, and up to 3 photos.
- **FR-13** Users can post a short "testimony" (a love note to a cafe) displayed as a sticky-note or polaroid card.
- **FR-14** Users can edit and delete their own reviews; report inappropriate ones.
- **FR-15** Basic moderation: profanity filter, rate limiting, admin review queue.

### 7.4 Accounts

- **FR-16** Sign up and log in with email or Google. Profile shows username, avatar and review history.
- **FR-17** Saved cafes ("want to try" and "favourites").

### 7.5 Content and data

- **FR-18** Cafe records: id, name, city, province, lat/lng, address, hours, price tier, tags, drinks\[\], menu\_url, photos\[\], socials{}, created/updated.
- **FR-19** Seed data entered manually and from public sources. Respect each source's terms; photos need permission or must come from the cafe's own public pages with credit.

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

### 8.3 Typography

- **Display:** oversized, tight, bold grotesque or sans for hero words, repeated and layered behind imagery (from the iced latte poster).
- **Accent:** elegant italic serif or script for captions and flourishes ("for marketplaces" style).
- **Handwritten:** a marker or handwriting font for annotations, arrows and circled words.
- **Body:** clean sans for readability.

### 8.4 Visual language and signature components

- **Folder-tab navigation:** textured stacked folders in pink, cream, olive and black as the section nav or city picker.
- **Lace borders:** scalloped lace dividers between sections and around cards.
- **Badge or ID card:** each cafe has a "cafe ID" card with a binder clip, photo in a stamp frame and barcode; reviewers get a "regular" badge.
- **Collage and cut-outs:** drink photos as cut-outs on pink backgrounds with sticker labels (e.g. a lime pill reading "iced latte").
- **Polaroid, photobooth strips and tape:** gallery and review cards.
- **Metallic stars and sparkles:** floating decorative elements.
- **Handwritten annotations:** doodled arrows and circled words around the search bar.
- **Surreal product moments:** a playful hero or loading element in the spirit of the IV-bag coffee (e.g. a drip loader). Keep it tasteful.
- **Paper texture and slight grain** across backgrounds.

### 8.5 Motion (scroll-triggered)

Placement decisions, as requested:

| Section | Animation |
| --- | --- |
| **Hero** | Large words stagger in and repeat/echo behind a floating drink cut-out; stars twinkle; search bar bounces in last |
| **Mood chips** | Pop in like stickers with a slight rotation; hover wiggle |
| **Folder nav** | Folders slide up and fan out as you scroll, active folder rises |
| **How it works** | Three steps appear as polaroids "pinned" one by one with tape snapping on |
| **Results grid** | Cards rise and settle with stagger; ID card swings on its clip on hover |
| **Cafe gallery** | Polaroids scatter then straighten on enter; lightbox zoom |
| **Reviews** | Sticky notes drop in at slight angles; new review animates onto the wall |
| **Lace dividers** | Draw in from left to right |
| **Footer** | Thank-you in oversized type with a drifting star trail |

Rules: animation must respect `prefers-reduced-motion`, stay under \~60fps budget on mid-range phones, and never block content or search.

### 8.6 Accessibility

- WCAG AA contrast (check pink-on-pink and lime combinations).
- Full keyboard navigation, visible focus states, alt text on all images, ARIA labels on custom controls.
- Decorative elements marked as presentational.

## 9. Technical Approach (suggested)

| Layer | Suggestion | Why |
| --- | --- | --- |
| Frontend | Next.js (React) + Tailwind CSS | Deployable, widely recognised on CVs |
| Animation | GSAP ScrollTrigger or Framer Motion | Scroll-triggered effects, stagger, SVG draw |
| Backend / DB | Supabase (Postgres + auth + storage) | Accounts, reviews, image uploads in one service |
| Maps / location | Leaflet + OpenStreetMap (free) or Google Maps Places | Avoids cost; Google gives richer data |
| Search | MVP: SQL text and tag matching plus alias dictionary. Phase 3: weighted tag scoring, optional embeddings | Simple first, smarter later |
| Hosting | Vercel | Free tier, CI from GitHub |
| Repo | GitHub with README, screenshots, live link, architecture diagram | Portfolio value |

**Search scoring sketch (Phase 3):** score = w1·tag overlap + w2·drink match + w3·review sentiment on vibe words + w4·proximity. Return top N with a short "matched because…" explanation.

## 10. Content, Legal and Privacy

- Cafe info and photos: use permission or properly credited public material; add a "claim or correct this listing" email link.
- Reviews: user-generated content terms, report button, takedown process.
- Privacy: collect minimal data (email, username); location used in-browser only unless saved; clear privacy notice (follow PIPEDA principles).
- Social links open externally; no scraping of social platforms.

## 11. Milestones

| Phase | Deliverable | Rough effort |
| --- | --- | --- |
| 0 | Design system in Figma/Canva: palette, type, folder/lace/badge components, wireframes | 1 week |
| 1 | MVP: landing, drink search, cafe pages, seed data, animations, deploy | 3–4 weeks |
| 2 | Accounts, reviews, geolocation and map, filters | 3 weeks |
| 3 | Vibe search, saved cafes, owner claim flow | 3+ weeks |
| Polish | README, case study, demo GIF, CV bullet | 1 week |

Fit this around coursework and co-op: ship MVP before a term gets busy, then iterate.

## 12. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Not enough cafe data | Start with Waterloo Region; hand-curate; add community "suggest a cafe" form |
| Over-scoped | Strict phasing; vibe search is optional |
| Heavy animation hurts performance | Lazy-load, compress images, reduced-motion fallback |
| Fake or abusive reviews | Auth required, rate limits, report and moderation queue |
| Photo and copyright issues | Permission or credit only; takedown email |
| Maps API costs | Use OpenStreetMap or free-tier limits |

## 13. Open Questions

1. Site name and logo? (Needs a whimsical name, e.g. a coffee pun.)
2. Which cities after Waterloo Region: Toronto, Ottawa, Vancouver?
3. Google Places data vs fully hand-curated listings?
4. Do you want a light "cafe owner" contact form in MVP so cafes can request updates?
5. Should reviews require an account from day one, or allow anonymous testimonies with moderation?

## 14. CV Framing (draft bullet)

*Designed and built a full-stack, Canada-wide cafe discovery web app with mood- and drink-based search, scroll-driven animations, user reviews and social integration; deployed on Vercel with a Supabase backend.*
