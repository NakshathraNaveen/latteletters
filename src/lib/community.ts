/**
 * Community cafes: spots people added on latteletters because they weren't
 * on OpenStreetMap yet. They stay for good (see migration 0006). Reads use
 * the public client, so row level security only ever returns visible ones.
 */
import { cacheLife, cacheTag } from "next/cache";
import { supabasePublic } from "./supabase/public";
import type { Cafe } from "./types";
import type { CafeKind } from "./cafe-kinds";
import { inferTags } from "./vibes";

export const COMMUNITY_TAG = "community-cafes";
export const communityTag = (uuid: string) => `community:${uuid}`;


const KIND_CUISINE: Record<CafeKind, string[]> = {
  coffee: ["coffee_shop"],
  tea: ["tea"],
  bubble_tea: ["bubble_tea"],
  bakery: ["coffee_shop", "bakery"],
  dessert: ["coffee_shop", "dessert"],
};

const COLUMNS = "id, name, street, neighbourhood, city, country, lat, lng, kind, instagram, created_at, adder:profiles(username)";

type Row = {
  id: string;
  name: string;
  street: string | null;
  neighbourhood: string | null;
  city: string | null;
  country: string | null;
  lat: number;
  lng: number;
  kind: CafeKind;
  instagram: string | null;
  created_at: string;
  adder: { username: string } | null;
};

const ACCENTS: Cafe["accent"][] = ["hotpink", "lavender", "olive", "lime", "lemon"];

function toCafe(r: Row): Cafe {
  const cafe: Cafe = {
    id: `c-${r.id}`,
    source: "community",
    addedBy: r.adder?.username ?? null,
    name: r.name,
    street: r.street,
    neighbourhood: r.neighbourhood,
    city: r.city,
    country: r.country,
    lat: r.lat,
    lng: r.lng,
    hours: null,
    brand: null,
    cuisine: KIND_CUISINE[r.kind] ?? ["coffee_shop"],
    wifi: false,
    outdoorSeating: false,
    vegan: false,
    wheelchair: false,
    socials: r.instagram ? [{ platform: "instagram", handle: `@${r.instagram}`, url: `https://www.instagram.com/${r.instagram}` }] : [],
    tags: [],
    accent: ACCENTS[parseInt(r.id.slice(0, 6), 16) % ACCENTS.length],
  };
  cafe.tags = inferTags(cafe);
  return cafe;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** One community cafe by its URL id ("c-<uuid>"). */
export async function communityCafeById(id: string): Promise<Cafe | null> {
  "use cache";
  const uuid = id.slice(2);
  if (!id.startsWith("c-") || !UUID.test(uuid)) return null;
  cacheTag(communityTag(uuid));
  cacheLife("days");
  const { data, error } = await supabasePublic().from("community_cafes").select(COLUMNS).eq("id", uuid).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toCafe(data as unknown as Row) : null;
}

/** Community cafes inside a box around a point. Refreshed the moment one is added. */
export async function communityCafesNear(lat: number, lng: number, radiusKm: number): Promise<Cafe[]> {
  "use cache";
  cacheTag(COMMUNITY_TAG);
  cacheLife("days");
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  const { data, error } = await supabasePublic()
    .from("community_cafes")
    .select(COLUMNS)
    .gte("lat", lat - dLat)
    .lte("lat", lat + dLat)
    .gte("lng", lng - dLng)
    .lte("lng", lng + dLng)
    .limit(300);
  if (error) throw new Error(error.message);
  return (data as unknown as Row[]).map(toCafe);
}

/** Community cafes where every word typed is in the name or the city ("bean there toronto"). */
export async function searchCommunityCafes(q: string): Promise<Cafe[]> {
  "use cache";
  cacheTag(COMMUNITY_TAG);
  cacheLife("hours");
  const words = q
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}'&-]/gu, "")) // keep PostgREST filter syntax out
    .filter((w) => w.length >= 2)
    .slice(0, 4);
  if (!words.length) return [];
  let query = supabasePublic().from("community_cafes").select(COLUMNS);
  for (const w of words) query = query.or(`name.ilike.*${w}*,city.ilike.*${w}*`);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(8);
  if (error) throw new Error(error.message);
  return (data as unknown as Row[]).map(toCafe);
}
