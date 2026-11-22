import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ACCENT_BG, Barcode, CafeIdCard, cafeDrink, placeLine } from "@/components/CafeIdCard";
import { DrinkCup } from "@/components/DrinkCup";
import { DripLoader } from "@/components/DripLoader";
import { NotesWall } from "@/components/NotesWall";
import { SocialLinks } from "@/components/SocialLinks";
import { BinderClip, LaceDivider, MetalStar } from "@/components/decor";
import { SaveButton } from "@/components/SaveButton";
import { getCurrentUser } from "@/lib/auth";
import { savedIdsSafe } from "@/lib/saved";
import { cafeById, cafesNear, distanceKm, roundCoord } from "@/lib/osm";
import { cafeStatsSafe } from "@/lib/posts";
import type { Cafe } from "@/lib/types";
import { VIBES, VIBE_RULES } from "@/lib/vibes";

export async function generateMetadata(props: PageProps<"/cafe/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const cafe = await cafeById(id).catch(() => null);
  if (!cafe) return { title: "Cafe" };
  const place = placeLine(cafe);
  return { title: place ? `${cafe.name} — ${place}` : cafe.name, description: `${cafe.name} on latteletters` };
}

export default function CafePage(props: PageProps<"/cafe/[id]">) {
  return (
    <Suspense fallback={<DripLoader label="pulling the file…" />}>
      <CafeContent params={props.params} />
    </Suspense>
  );
}

/* ───────────── helpers ───────────── */

const DAYS: Record<string, string> = { Mo: "Mon", Tu: "Tue", We: "Wed", Th: "Thu", Fr: "Fri", Sa: "Sat", Su: "Sun", PH: "Holidays" };

/** "Mo-Fr 08:00-18:00; Sa 09:00-17:00" → ["Mon–Fri 08:00–18:00", "Sat 09:00–17:00"] */
function formatHours(raw: string): string[] {
  return raw
    .split(";")
    .map((part) =>
      part
        .trim()
        .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (d) => DAYS[d])
        .replace(/-/g, "–")
        .replace(/\boff\b/i, "closed"),
    )
    .filter(Boolean);
}

const prettyCuisine = (c: string) => c.replace(/_/g, " ");

/* ───────────── page ───────────── */

async function CafeContent({ params }: { params: PageProps<"/cafe/[id]">["params"] }) {
  const { id } = await params;
  let cafe: Cafe | null;
  try {
    cafe = await cafeById(id);
  } catch {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-display text-4xl">the cafe map is a little busy</h1>
        <p className="mt-2">OpenStreetMap didn&rsquo;t answer in time. Refresh in a few seconds.</p>
      </div>
    );
  }
  if (!cafe) notFound();

  const [osmType, osmId] = cafe.id.split("-");
  const place = placeLine(cafe);
  const address = [cafe.street, cafe.neighbourhood, cafe.city, cafe.country].filter(Boolean).join(", ");
  const nearbyHref = `/search?lat=${roundCoord(cafe.lat).toFixed(3)}&lng=${roundCoord(cafe.lng).toFixed(3)}&r=1`;
  const amenities = [
    cafe.wifi && "📶 wifi",
    cafe.outdoorSeating && "☀️ outdoor seating",
    cafe.vegan && "🌱 vegan options",
    cafe.wheelchair && "♿ wheelchair accessible",
  ].filter(Boolean) as string[];
  const osm = `https://www.openstreetmap.org/export/embed.html?bbox=${cafe.lng - 0.006}%2C${cafe.lat - 0.004}%2C${cafe.lng + 0.006}%2C${cafe.lat + 0.004}&layer=mapnik&marker=${cafe.lat}%2C${cafe.lng}`;

  return (
    <article className="mx-auto max-w-6xl px-5 pt-8">
      <nav aria-label="Breadcrumb" className="font-hand text-xl">
        <Link href={nearbyHref} className="underline-offset-4 hover:underline">
          ← more cafes near here
        </Link>
      </nav>

      {/* ─────────── header ─────────── */}
      <header className="mt-8 grid grid-cols-[minmax(0,1fr)] items-start gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          {place && <p className="font-serif text-2xl">{place}</p>}
          <h1 className="mt-1 break-words font-display text-[clamp(3rem,9vw,6.5rem)] leading-[0.9]">{cafe.name}</h1>
          <Suspense fallback={<div className="mt-4 h-10" />}>
            <SaveCafe cafe={cafe} />
          </Suspense>
          <p className="mt-4 font-label text-sm uppercase tracking-wider">
            {cafe.brand ? `part of ${cafe.brand}` : "independent cafe ✦"}
            {cafe.cuisine.length > 0 && ` · ${cafe.cuisine.map(prettyCuisine).join(", ")}`}
          </p>
          {cafe.tags.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Vibes">
              {cafe.tags.map((t, i) => (
                <li key={t}>
                  <Link
                    href={`${nearbyHref}&q=${encodeURIComponent(VIBES[t].label)}`}
                    title={VIBE_RULES[t](cafe) ?? undefined}
                    className="wiggle inline-flex items-center gap-1 rounded-full border-2 border-cola bg-lemon px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_var(--color-cola)]"
                    style={{ "--r": `${[-3, 2, -2, 4][i % 4]}deg` } as React.CSSProperties}
                  >
                    <span aria-hidden>{VIBES[t].emoji}</span> {VIBES[t].label}
                    <span className="sr-only"> ({VIBE_RULES[t](cafe)})</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {amenities.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1 font-hand text-xl" aria-label="Amenities">
              {amenities.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
        </div>

        {/* the big ID card */}
        <div className="relative pt-8">
          <MetalStar size={52} className="absolute -left-4 top-2 z-20 animate-twinkle" />
          <div className="swing relative rotate-2">
            <BinderClip className="absolute -top-8 left-1/2 z-10 w-20 -translate-x-1/2" />
            <div className={`paper rounded-3xl border-2 border-cola p-6 shadow-[var(--shadow-lift)] ${ACCENT_BG[cafe.accent]}`}>
              <div className="flex items-start gap-4">
                <div className="stamp w-24 shrink-0 -rotate-3 shadow-sm">
                  <div className="grid aspect-[4/5] place-items-center bg-cotton-deep">
                    <DrinkCup drink={cafeDrink(cafe)} className="h-[85%] w-auto" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="font-hand text-2xl leading-none">cafe ID</p>
                  <dl className="mt-3 space-y-2 font-mono text-sm">
                    <div>
                      <dt className="font-semibold">Address</dt>
                      <dd>{address || "not on the map yet"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Hours</dt>
                      <dd>
                        {cafe.hours ? (
                          <ul>
                            {formatHours(cafe.hours).map((h) => (
                              <li key={h}>{h}</li>
                            ))}
                          </ul>
                        ) : (
                          "not listed. Check their socials!"
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              <Barcode seed={cafe.id} className="mt-4 h-8 w-40" />
            </div>
          </div>
        </div>
      </header>

      <LaceDivider color="var(--color-hotpink)" className="mt-16 opacity-80" />

      {/* ─────────── socials + map ─────────── */}
      <div className="mt-14 grid gap-12 md:grid-cols-2">
        <section aria-labelledby="socials">
          <h2 id="socials" className="font-display text-3xl">
            go show them some love
          </h2>
          <p className="mt-1 font-hand text-xl">follow, tag &amp; help small cafes grow</p>
          <div className="mt-4">
            {cafe.socials.length ? (
              <SocialLinks cafeId={cafe.id} socials={cafe.socials} />
            ) : (
              <p className="text-cola/80">No socials on the map yet. If you know them, you can add them on OpenStreetMap (link below).</p>
            )}
          </div>

          <div className="mt-10 rounded-2xl border-2 border-dashed border-cola/50 bg-lemon/60 p-5">
            <h3 className="font-display text-xl">spotted a mistake?</h3>
            <p className="mt-1 text-sm">
              Cafe info comes from OpenStreetMap, the free map anyone can edit. Fix hours, add an Instagram, or mark it closed, and
              latteletters updates within a day.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
              <a
                href={`https://www.openstreetmap.org/edit?${osmType}=${osmId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                edit on OpenStreetMap ↗
              </a>
              <a href="mailto:latteletters.contact@gmail.com?subject=latteletters%20listing%20update" className="underline underline-offset-4">
                or email us
              </a>
            </div>
          </div>
        </section>

        <section aria-labelledby="map">
          <h2 id="map" className="font-display text-3xl">
            find it
          </h2>
          <div className="relative mt-4 -rotate-1 bg-lemon p-3 pb-2 shadow-[var(--shadow-paper)]">
            <span className="tape -top-3 right-8 rotate-6" />
            <iframe title={`Map showing the location of ${cafe.name}`} src={osm} loading="lazy" className="aspect-[4/3] w-full border-0" />
            <p className="flex flex-wrap items-center justify-between gap-2 pt-2 font-hand text-xl">
              <span>{cafe.street ?? place}</span>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${cafe.lat},${cafe.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm font-semibold underline underline-offset-4"
              >
                get directions <span className="sr-only">(opens in a new tab)</span> ↗
              </a>
            </p>
          </div>
          <p className="mt-3 text-right text-xs text-cola/70">
            Map &amp; data ©{" "}
            <a href="https://www.openstreetmap.org/copyright" className="underline" target="_blank" rel="noopener noreferrer">
              OpenStreetMap contributors
            </a>
          </p>
        </section>
      </div>

      {/* ─────────── reviews + love notes (Phase 2) ─────────── */}
      <section aria-labelledby="notes" className="mt-20 scroll-mt-24 rounded-3xl bg-cola p-6 text-cotton sm:p-8" id="love-notes">
        <h2 id="notes" className="font-display text-3xl md:text-4xl">
          love notes for {cafe.name}
        </h2>
        <Suspense fallback={<p className="mt-4 font-hand text-2xl">unpinning the notes…</p>}>
          <NotesWall cafeId={cafe.id} cafeName={cafe.name} />
        </Suspense>
      </section>

      {/* ─────────── nearby ─────────── */}
      <section aria-labelledby="nearby" className="mt-20">
        <h2 id="nearby" className="font-display text-4xl">
          also nearby, <span className="font-serif">try…</span>
        </h2>
        <Suspense fallback={<p className="mt-6 font-hand text-2xl">finding neighbours…</p>}>
          <Nearby cafe={cafe} />
        </Suspense>
      </section>
    </article>
  );
}

async function Nearby({ cafe }: { cafe: Cafe }) {
  let near: Cafe[] = [];
  try {
    near = await cafesNear(roundCoord(cafe.lat), roundCoord(cafe.lng), 1);
  } catch {
    return null;
  }
  const picks = near
    .filter((c) => c.id !== cafe.id)
    .map((c) => ({ ...c, distanceKm: distanceKm(cafe.lat, cafe.lng, c.lat, c.lng) }))
    .sort((a, b) => Number(!!a.brand) - Number(!!b.brand) || a.distanceKm - b.distanceKm)
    .slice(0, 3);
  if (!picks.length) return <p className="mt-6 font-hand text-2xl">no other mapped cafes within a kilometre!</p>;
  const stats = await cafeStatsSafe(picks.map((c) => c.id));
  const saved = await viewerSaved(picks.map((c) => c.id));
  return (
    <div data-fx="rise" className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-3">
      {picks.map((c, i) => (
        <CafeIdCard key={c.id} cafe={c} index={i} stats={stats[c.id]} saved={saved ? saved.has(c.id) : null} />
      ))}
    </div>
  );
}

/** The logged-in person's saved cafes among these ids (null when logged out). */
async function viewerSaved(ids: string[]) {
  const viewer = await getCurrentUser().catch(() => null);
  return savedIdsSafe(viewer?.profile ? viewer.id : undefined, ids);
}

async function SaveCafe({ cafe }: { cafe: Cafe }) {
  const saved = await viewerSaved([cafe.id]);
  return <SaveButton cafeId={cafe.id} cafeName={cafe.name} saved={saved ? saved.has(cafe.id) : null} variant="pill" className="relative mt-4 inline-block" />;
}
