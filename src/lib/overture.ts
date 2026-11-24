/**
 * Cafes from Overture Maps (https://overturemaps.org), loaded into our own
 * database by scripts/overture/import.mjs. Much better coverage of small
 * cafes than OpenStreetMap, and fast: no third-party server in the way.
 * Data: CDLA-Permissive-2.0 / Apache-2.0 / CC0, credited wherever it shows.
 */
import { cacheLife, cacheTag } from "next/cache";
import { social, safeUrl } from "./osm";
import { supabasePublic } from "./supabase/public";
import type { Cafe, Social } from "./types";
import { inferTags } from "./vibes";

export const OVERTURE_TAG = "overture-cafes";

/** Give up on a slow database quickly; callers fall back to OpenStreetMap. Errors aren't cached. */
const TIMEOUT_MS = 5000;
const limit = () => AbortSignal.timeout(TIMEOUT_MS);

const COLUMNS = "id, name, lat, lng, kind, street, city, country, brand, website, instagram";

export type OvertureRow = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** see KINDS */
  kind: number;
  street: string | null;
  city: string | null;
  country: string | null;
  brand: string | null;
  /** without https:// ("example.com/menu") */
  website: string | null;
  /** handle only */
  instagram: string | null;
};

const ACCENTS: Cafe["accent"][] = ["hotpink", "lavender", "olive", "lime", "lemon"];

/**
 * Overture category, stored as a small number (must match KIND in
 * scripts/overture/import.mjs) → the OSM-style cuisine tags the site uses.
 */
const KINDS: Record<number, string[]> = {
  1: ["coffee_shop"], // coffee_shop
  2: ["coffee_shop"], // cafe
  3: ["bubble_tea"], // bubble_tea_shop
  4: ["tea"], // tea_room
  5: ["coffee_shop", "chinese"], // hong_kong_style_cafe
};

let countryNames: Intl.DisplayNames | null = null;
function countryName(code: string | null) {
  if (!code) return null;
  try {
    countryNames ??= new Intl.DisplayNames(["en"], { type: "region" });
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** A brand that's just the cafe's own name isn't a chain ("Mofer Coffee" → brand "Mofer coffee"). */
function chainBrand(name: string, brand: string | null) {
  if (!brand) return null;
  const n = name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  const b = brand.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  return n === b ? null : brand;
}

export function toCafe(r: OvertureRow): Cafe {
  const website = safeUrl(r.website ?? undefined);
  const socials = [
    social("instagram", r.instagram ?? undefined, "https://www.instagram.com/"),
    website ? ({ platform: "website", url: website, handle: new URL(website).hostname.replace(/^www\./, "") } as Social) : null,
  ].filter((s): s is Social => s !== null);

  const cafe: Cafe = {
    id: `o-${r.id}`,
    source: "overture",
    name: r.name,
    street: r.street,
    neighbourhood: null,
    city: r.city,
    country: countryName(r.country),
    lat: r.lat,
    lng: r.lng,
    hours: null,
    brand: chainBrand(r.name, r.brand),
    cuisine: KINDS[r.kind] ?? ["coffee_shop"],
    wifi: false,
    outdoorSeating: false,
    vegan: false,
    wheelchair: false,
    socials,
    tags: [],
    accent: ACCENTS[parseInt(r.id.slice(0, 6), 16) % ACCENTS.length],
  };
  cafe.tags = inferTags(cafe);
  return cafe;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function overtureCafeById(id: string): Promise<Cafe | null> {
  "use cache";
  cacheTag(OVERTURE_TAG);
  cacheLife("days");
  const uuid = id.slice(2);
  if (!id.startsWith("o-") || !UUID.test(uuid)) return null;
  const { data, error } = await supabasePublic().from("overture_cafes").select(COLUMNS).eq("id", uuid).abortSignal(limit()).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toCafe(data as OvertureRow) : null;
}

/** Overture cafes in a box around a point, nearest first. */
export async function overtureCafesNear(lat: number, lng: number, radiusKm: number): Promise<Cafe[]> {
  "use cache";
  cacheTag(OVERTURE_TAG);
  cacheLife("days");
  const { data, error } = await supabasePublic().rpc("overture_cafes_near", { lat, lng, radius_km: radiusKm, max_results: 800 }).abortSignal(limit());
  if (error) throw new Error(error.message);
  return (data as OvertureRow[]).map(toCafe);
}

/**
 * Candidate cafes for a name search (any distinctive word, joined words split).
 * typoMode: match on the first three letters of each word instead, for when
 * every word has a typo. findCafes ranks the candidates (lib/match.ts).
 */
export async function searchOvertureCafes(q: string, near: { lat: number; lng: number } | null, typoMode = false): Promise<Cafe[]> {
  "use cache";
  cacheTag(OVERTURE_TAG);
  cacheLife("days");
  const { data, error } = await supabasePublic()
    .rpc("search_overture_cafes", {
      q,
      near_lat: near?.lat ?? null,
      near_lng: near?.lng ?? null,
      max_results: 120,
      typo_mode: typoMode,
    })
    .abortSignal(limit());
  if (error) throw new Error(error.message);
  return (data as OvertureRow[]).map(toCafe);
}
