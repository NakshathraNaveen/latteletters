/**
 * "Cafe ID" card (PRD §8.4): binder clip, stamp-framed drink, barcode.
 * Swings on its clip on hover (§8.5 results grid).
 */
import Link from "next/link";
import type { Cafe } from "@/lib/types";
import type { DrinkId } from "@/lib/drinks";
import type { CafeStats } from "@/lib/posts";
import { VIBES } from "@/lib/vibes";
import { DrinkCup } from "./DrinkCup";
import { BinderClip } from "./decor";
import { SaveButton } from "./SaveButton";

export const ACCENT_BG: Record<Cafe["accent"], string> = {
  hotpink: "bg-hotpink",
  lavender: "bg-lavender",
  olive: "bg-[#c5d28a]",
  lime: "bg-lime",
  lemon: "bg-lemon",
};

/** Pick an illustration that fits the kind of cafe (OSM has no photos). */
export function cafeDrink(cafe: Cafe): DrinkId {
  const c = cafe.cuisine;
  if (c.includes("bubble_tea")) return "bubble-tea";
  if (c.includes("tea") || c.includes("japanese")) return "matcha-latte";
  if (c.some((x) => ["ice_cream", "gelato", "dessert", "cake"].includes(x))) return "affogato";
  const pool: DrinkId[] = ["iced-latte", "latte", "cappuccino", "cold-brew", "flat-white", "mocha"];
  return pool[[...cafe.id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % pool.length];
}

export function formatDistance(km?: number) {
  if (km === undefined) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export function placeLine(cafe: Cafe) {
  return [cafe.neighbourhood, cafe.city].filter(Boolean).join(", ") || cafe.country || "";
}

/** Deterministic fake barcode from the cafe id. */
export function Barcode({ seed, className = "" }: { seed: string; className?: string }) {
  let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const bars: number[] = [];
  for (let i = 0; i < 34; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    bars.push(1 + (h % 3));
  }
  let x = 0;
  return (
    <svg aria-hidden viewBox="0 0 120 30" preserveAspectRatio="none" className={className}>
      {bars.map((w, i) => {
        const rect = i % 2 === 0 ? <rect key={i} x={x} y="0" width={w * 0.9} height="30" fill="var(--color-ink)" /> : null;
        x += w * 1.2;
        return rect;
      })}
    </svg>
  );
}

/** "★ 4.5 (3) · ✎ 2" sticker; renders nothing until someone has posted. */
export function StatsSticker({ stats, className = "" }: { stats?: CafeStats; className?: string }) {
  if (!stats || (!stats.reviews && !stats.notes)) return null;
  const label = [
    stats.reviews ? `${stats.avg.toFixed(1)} out of 5 stars from ${stats.reviews} review${stats.reviews > 1 ? "s" : ""}` : "",
    stats.notes ? `${stats.notes} love note${stats.notes > 1 ? "s" : ""}` : "",
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <p
      aria-label={label}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-cola bg-lemon px-2 py-0.5 text-[10px] font-semibold shadow-[1px_1px_0_var(--color-cola)] sm:text-xs ${className}`}
    >
      {stats.reviews > 0 && (
        <span aria-hidden>
          <span className="text-hotpink [text-shadow:1px_1px_0_var(--color-cola)]">★</span> {stats.avg.toFixed(1)} <span className="font-normal text-cola/70">({stats.reviews})</span>
        </span>
      )}
      {stats.notes > 0 && <span aria-hidden>✎ {stats.notes}</span>}
    </p>
  );
}

export function CafeIdCard({
  cafe,
  reasons,
  index = 0,
  stats,
  saved,
}: {
  cafe: Cafe;
  reasons?: string[];
  index?: number;
  stats?: CafeStats;
  /** true/false = logged in, null = logged out (heart links to login), undefined = no heart */
  saved?: boolean | null;
}) {
  const tilt = [-1.5, 1.2, -0.8, 1.8, -1.2, 0.8][index % 6];
  const distance = formatDistance(cafe.distanceKm);
  const place = placeLine(cafe);

  return (
    <article data-fx-item className="relative pt-5 sm:pt-7" style={{ transform: `rotate(${tilt}deg)` }}>
      <div className="swing relative">
        <BinderClip className="absolute -top-5 left-1/2 z-10 w-11 -translate-x-1/2 sm:-top-7 sm:w-16" />
        {saved !== undefined && <SaveButton cafeId={cafe.id} cafeName={cafe.name} saved={saved} className="absolute -left-2 -top-2 z-20 sm:-left-3 sm:-top-3" />}
        <div
          className={`paper relative overflow-hidden rounded-2xl border-2 border-cola/80 p-2.5 shadow-[var(--shadow-paper)] sm:p-4 transition-shadow hover:shadow-[var(--shadow-lift)] ${ACCENT_BG[cafe.accent]}`}
        >
          {distance && (
            <span className="absolute right-2 top-2 rounded-full border border-cola/60 bg-lemon/80 px-1.5 py-0.5 font-label text-[8px] sm:right-3 sm:top-3 sm:px-2 sm:text-[9px] uppercase tracking-widest">
              {distance}
            </span>
          )}

          <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-4">
            <div className="shrink-0">
              <div className="stamp w-12 rotate-[-3deg] shadow-sm sm:w-24">
                <div className="grid aspect-[4/5] place-items-center bg-cotton-deep">
                  <DrinkCup drink={cafeDrink(cafe)} className="h-[85%] w-auto" />
                </div>
              </div>
              <Barcode seed={cafe.id} className="mt-2 hidden h-6 w-24 sm:block" />
            </div>

            <div className="min-w-0 flex-1 sm:pt-1">
              <p className="font-hand text-sm leading-none text-cola/80 sm:text-xl">your new favourite</p>
              <h3 className="mt-1 break-words font-display text-lg leading-[0.95] text-cola sm:text-2xl">
                {/* stretched link — the whole card is clickable */}
                <Link href={`/cafe/${cafe.id}`} className="after:absolute after:inset-0 after:content-['']">
                  {cafe.name}
                </Link>
              </h3>
              <dl className="mt-1.5 space-y-0.5 font-mono text-[10px] leading-snug sm:mt-2 sm:text-[13px]">
                {cafe.street && (
                  <div className="flex gap-1">
                    <dt className="sr-only">Address</dt>
                    <dd>{cafe.street}</dd>
                  </div>
                )}
                {place && (
                  <div className="flex gap-1">
                    <dt className="font-semibold">Where:</dt>
                    <dd>{place}</dd>
                  </div>
                )}
                <div className="hidden gap-1 sm:flex">
                  <dt className="font-semibold">Kind:</dt>
                  <dd>{cafe.brand ? `${cafe.brand} (chain)` : "independent ✦"}</dd>
                </div>
              </dl>
              <StatsSticker stats={stats} className="mt-1.5" />
            </div>
          </div>

          {cafe.tags.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1 sm:mt-3 sm:gap-1.5" aria-label="Vibes">
              {cafe.tags.slice(0, 4).map((t) => (
                <li key={t} className="rounded-full bg-cola px-1.5 py-0.5 text-[10px] font-semibold text-cotton sm:px-2.5 sm:text-xs">
                  {VIBES[t].label}
                </li>
              ))}
            </ul>
          )}

          {reasons && reasons.length > 0 && (
            <p className="mt-2 border-t-2 border-dashed border-cola/30 pt-1.5 font-hand text-sm leading-tight text-cola sm:mt-3 sm:pt-2 sm:text-lg">
              <span aria-hidden>↳ </span>
              <span className="sr-only">Matched because: </span>
              {reasons.join(" · ")}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
