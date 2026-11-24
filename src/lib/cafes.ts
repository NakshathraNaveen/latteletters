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
 * Cafes matching a name: community first, then Overture, then OpenStreetMap
 * (worldwide, via Photon) for anything Overture doesn't have. The same cafe
 * from two sources shows once, so its reviews don't get split.
 */
export async function findCafes(q: string, near: { lat: number; lng: number } | null): Promise<{ cafes: FoundCafe[]; mapFailed: boolean }> {
  const [community, overture, osm] = await Promise.all([
    searchCommunityCafes(q).catch(() => [] as Cafe[]),
    searchOvertureCafes(q, near).then(
      (r) => ({ ok: true as const, r }),
      () => ({ ok: false as const, r: [] as Cafe[] }),
    ),
    photon(q, near).then(
      (r) => ({ ok: true as const, r }),
      () => ({ ok: false as const, r: [] as FoundCafe[] }),
    ),
  ]);
  const list: FoundCafe[] = [
    ...community.map((c) => found(c, "added by the community")),
    ...overture.r.map((c) => found(c, c.cuisine.includes("bubble_tea") ? "boba" : c.cuisine.includes("tea") ? "tea room" : "cafe")),
  ];
  const isDuplicate = (f: FoundCafe) => list.some((k) => sameName(k.name) === sameName(f.name) && distanceKm(k.lat, k.lng, f.lat, f.lng) < 0.15);
  for (const f of osm.r) if (!isDuplicate(f)) list.push(f);
  return { cafes: list.slice(0, 15), mapFailed: !overture.ok && !osm.ok };
}
