/**
 * The one place pages and actions get cafes from. A cafe comes from:
 *  - Overture Maps ("o-<uuid>"): our main source, loaded into our database
 *  - OpenStreetMap ("node-123"): countries Overture isn't loaded for yet,
 *    and cafes people found by name that Overture doesn't have
 *  - the community ("c-<uuid>"): cafes people added themselves
 */
import { cacheLife } from "next/cache";
import { communityCafeById, communityCafesNear, searchCommunityCafes } from "./community";
import { cafesNear as osmCafesNear, distanceKm, osmCafeById, sameName } from "./osm";
import { matchScore } from "./match";
import { overtureCafeById, overtureCafesNear, searchOvertureCafes } from "./overture";
import type { Cafe } from "./types";

export { distanceKm, geocode, roundCoord } from "./osm";

export const CAFE_ID = /^((node|way|relation)-\d{1,15}|[co]-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
export const isCafeId = (id: unknown): id is string => typeof id === "string" && CAFE_ID.test(id);

export async function cafeById(id: string): Promise<Cafe | null> {
  if (id.startsWith("o-")) return overtureCafeById(id);
  if (id.startsWith("c-")) return communityCafeById(id);
  return osmCafeById(id);
}

/**
 * Cafes around a point: community + Overture, or community + OpenStreetMap
 * where Overture has nothing (countries not imported yet). If the database
 * hiccups we fall back to OpenStreetMap too; if that's down as well, it throws.
 */
export async function cafesNear(lat: number, lng: number, radiusKm: number): Promise<Cafe[]> {
  const [overture, community] = await Promise.all([
    overtureCafesNear(lat, lng, radiusKm).catch(() => [] as Cafe[]),
    communityCafesNear(lat, lng, radiusKm).catch(() => [] as Cafe[]),
  ]);
  const base = overture.length ? overture : await osmCafesNear(lat, lng, radiusKm);
  return [...community.filter((c) => distanceKm(lat, lng, c.lat, c.lng) <= radiusKm), ...base.filter((c) => distanceKm(lat, lng, c.lat, c.lng) <= radiusKm)];
}

/* ───────────── "find the cafe I went to" (search by name) ───────────── */

export type FoundCafe = {
  id: string;
  name: string;
  /** "Queen Street East, Toronto, Canada" */
  place: string;
  kind: string;
  community: boolean;
  lat: number;
  lng: number;
};

const PHOTON = "https://photon.komoot.io/api/";
const USER_AGENT = "latteletters/0.3 (cafe finder; https://latteletters.vercel.app)";
/** Photon filters: cafes plus the shops small cafes are often mapped as. */
const PHOTON_TAGS = ["amenity:cafe", "shop:coffee", "shop:tea", "shop:bubble_tea", "shop:bakery", "amenity:fast_food", "amenity:ice_cream", "shop:pastry"];
const KIND_LABEL: Record<string, string> = {
  cafe: "cafe",
  coffee: "coffee shop",
  coffee_shop: "coffee shop",
  tea: "tea shop",
  bubble_tea: "boba",
  bakery: "bakery",
  fast_food: "quick bites",
  ice_cream: "ice cream",
  pastry: "pastry shop",
  tea_room: "tea room",
  bubble_tea_shop: "boba",
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_type: "N" | "W" | "R";
    osm_id: number;
    osm_value: string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    locality?: string;
    city?: string;
    country?: string;
  };
};

const OSM_TYPE = { N: "node", W: "way", R: "relation" } as const;

async function photon(q: string, near: { lat: number; lng: number } | null): Promise<FoundCafe[]> {
  "use cache";
  cacheLife("days");
  const params = new URLSearchParams({ q, limit: "12", lang: "en" });
  for (const t of PHOTON_TAGS) params.append("osm_tag", t);
  if (near) {
    params.set("lat", String(near.lat));
    params.set("lon", String(near.lng));
  }
  const res = await fetch(`${PHOTON}?${params}`, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`Photon answered ${res.status}`);
  const json = (await res.json()) as { features?: PhotonFeature[] };
  const out: FoundCafe[] = [];
  const seen = new Set<string>();
  for (const f of json.features ?? []) {
    const p = f.properties;
    if (!p.name || !OSM_TYPE[p.osm_type]) continue;
    const id = `${OSM_TYPE[p.osm_type]}-${p.osm_id}`;
    if (seen.has(id) || !CAFE_ID.test(id)) continue;
    seen.add(id);
    const street = p.street ? [p.housenumber, p.street].filter(Boolean).join(" ") : null;
    out.push({
      id,
      name: p.name,
      place: [street, p.locality || p.district, p.city, p.country].filter(Boolean).join(", "),
      kind: KIND_LABEL[p.osm_value] ?? "cafe",
      community: false,
      lng: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
    });
  }
  return out;
}

const found = (c: Cafe, kind: string): FoundCafe => ({
  id: c.id,
  name: c.name,
  place: [c.street, c.neighbourhood, c.city, c.country].filter(Boolean).join(", "),
  kind,
  community: c.source === "community",
  lat: c.lat,
  lng: c.lng,
});

/**
 * Photon matches whole words, so "lala bakeshop" misses "La La Bakeshop" but
 * the joined-up "lalabakeshop" finds it (Photon forgives typos inside one
 * word). Short name-only queries are asked both ways.
 */
async function photonForgiving(q: string, near: { lat: number; lng: number } | null): Promise<FoundCafe[]> {
  const words = q.trim().split(/s+/);
  const joined = words.join("");
  if (words.length < 2 || words.length > 3 || q.includes(",") || joined.length > 30) return photon(q, near);
  const [plain, squashed] = await Promise.allSettled([photon(q, near), photon(joined, near)]);
  if (plain.status === "rejected" && squashed.status === "rejected") throw plain.reason;
  const out = plain.status === "fulfilled" ? [...plain.value] : [];
  for (const f of squashed.status === "fulfilled" ? squashed.value : []) if (!out.some((o) => o.id === f.id)) out.push(f);
  return out;
}

/**
 * Cafes matching a name: community, Overture, and OpenStreetMap (worldwide,
 * via Photon) for anything Overture doesn't have. Each source finds
 * candidates generously, then everything is ranked by matchScore, so small
 * typos and spacing don't matter. The same cafe from two sources shows once,
 * so its reviews don't get split.
 */
export async function findCafes(q: string, near: { lat: number; lng: number } | null): Promise<{ cafes: FoundCafe[]; mapFailed: boolean }> {
  const [community, overture, osm] = await Promise.all([
    searchCommunityCafes(q).catch(() => [] as Cafe[]),
    searchOvertureCafes(q, near).then(
      (r) => ({ ok: true as const, r }),
      () => ({ ok: false as const, r: [] as Cafe[] }),
    ),
    photonForgiving(q, near).then(
      (r) => ({ ok: true as const, r }),
      () => ({ ok: false as const, r: [] as FoundCafe[] }),
    ),
  ]);
  // every word mistyped? try again on the first few letters of each word
  let fromOverture = overture.r;
  if (overture.ok && fromOverture.filter((c) => matchScore(q, c.name, [c.street, c.city].filter(Boolean).join(", ")) >= 0.6).length < 3) {
    const more = await searchOvertureCafes(q, near, true).catch(() => [] as Cafe[]);
    const seen = new Set(fromOverture.map((c) => c.id));
    fromOverture = [...fromOverture, ...more.filter((c) => !seen.has(c.id))];
  }
  const kindOf = (c: Cafe) => (c.cuisine.includes("bubble_tea") ? "boba" : c.cuisine.includes("tea") ? "tea room" : "cafe");
  const list: FoundCafe[] = [...community.map((c) => found(c, "added by the community")), ...fromOverture.map((c) => found(c, kindOf(c)))];
  const isDuplicate = (f: FoundCafe) => list.some((k) => sameName(k.name) === sameName(f.name) && distanceKm(k.lat, k.lng, f.lat, f.lng) < 0.15);
  for (const f of osm.r) if (!isDuplicate(f)) list.push(f);

  const sourceOrder = (f: FoundCafe) => (f.community ? 0 : f.id.startsWith("o-") ? 1 : 2);
  const ranked = list
    .map((f, i) => ({ f, i, score: matchScore(q, f.name, f.place), km: near ? distanceKm(near.lat, near.lng, f.lat, f.lng) : 0 }))
    .filter((r) => r.score >= 0.45)
    .sort(
      (a, b) =>
        // a clearly better match wins; close calls go to the nearer cafe, then the source we trust most
        (Math.abs(b.score - a.score) > 0.08 ? b.score - a.score : 0) || a.km - b.km || sourceOrder(a.f) - sourceOrder(b.f) || a.i - b.i,
    );
  return { cafes: ranked.slice(0, 15).map((r) => r.f), mapFailed: !overture.ok && !osm.ok };
}
