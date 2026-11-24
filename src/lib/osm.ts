/**
 * Live cafe data from OpenStreetMap via the Nominatim API.
 * Data © OpenStreetMap contributors, available under the ODbL.
 *
 * Used for geocoding ("tokyo" → a point), single-cafe lookups, and area
 * searches in countries we haven't loaded from Overture yet (see overture.ts).
 *
 * Nominatim usage policy (https://operations.osmfoundation.org/policies/nominatim/):
 *  - identify the app with a User-Agent        → USER_AGENT below
 *  - max 1 request per second                  → throttle() below
 *  - cache results                             → 'use cache' on every lookup
 *  - show attribution                          → footer + cafe pages
 *
 * Failed requests throw, and thrown errors are never cached, so a temporary
 * outage doesn't get stuck in the cache.
 */
import { cacheLife } from "next/cache";
import type { Cafe, Place, Social } from "./types";
import { inferTags } from "./vibes";

const NOMINATIM = "https://nominatim.openstreetmap.org";
const USER_AGENT = "latteletters/0.3 (cafe finder; https://latteletters.vercel.app)";

/* ───────────── Nominatim: one request per second, per server instance ───────────── */

let queue: Promise<unknown> = Promise.resolve();
let lastRequest = 0;

function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(async () => {
    const wait = lastRequest + 1100 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequest = Date.now();
    return fn();
  });
  queue = next.catch(() => undefined);
  return next;
}

async function nominatim<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = `${NOMINATIM}${path}?${new URLSearchParams({ format: "jsonv2", ...params })}`;
  const res = await throttle(() =>
    fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
      signal: AbortSignal.timeout(12_000),
    }),
  );
  if (!res.ok) throw new Error(`OpenStreetMap lookup failed (${res.status})`);
  return res.json() as Promise<T>;
}

/* ───────────── mapping helpers ───────────── */

const ACCENTS: Cafe["accent"][] = ["hotpink", "lavender", "olive", "lime", "lemon"];

export function safeUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(candidate);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null; // never javascript: etc.
  } catch {
    return null;
  }
}

export function social(platform: Social["platform"], raw: string | undefined, base: string): Social | null {
  if (!raw) return null;
  const value = raw.trim();
  if (/^https?:\/\//i.test(value) || value.includes(".com/")) {
    const url = safeUrl(value);
    if (!url) return null;
    const handle = new URL(url).pathname.split("/").filter(Boolean)[0];
    return { platform, url, handle: handle ? `@${handle.replace(/^@/, "")}` : new URL(url).hostname };
  }
  const handle = value.replace(/^@/, "");
  if (!/^[\w.]+$/.test(handle)) return null;
  return { platform, url: `${base}${handle}`, handle: `@${handle}` };
}

/** One OSM object, whichever API it came from. */
type OsmPlace = {
  type: "node" | "way" | "relation";
  id: number;
  lat: number;
  lng: number;
  name?: string;
  tags: Record<string, string>;
  /** Nominatim's computed address (falls back to the object's own addr:* tags) */
  address?: Record<string, string>;
};

function toCafe(p: OsmPlace): Cafe | null {
  const t = p.tags;
  const a = p.address ?? {};
  const name = p.name || t.name || a.amenity || a.cafe || a.shop;
  if (!name || !Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return null; // unnamed cafes aren't useful to browse

  const road = a.road || t["addr:street"];
  const number = a.house_number || t["addr:housenumber"];
  const website = safeUrl(t.website || t["contact:website"] || t.url);
  const socials = [
    social("instagram", t["contact:instagram"] || t.instagram, "https://www.instagram.com/"),
    social("tiktok", t["contact:tiktok"] || t.tiktok, "https://www.tiktok.com/@"),
    social("facebook", t["contact:facebook"] || t.facebook, "https://www.facebook.com/"),
    website ? ({ platform: "website", url: website, handle: new URL(website).hostname.replace(/^www\./, "") } as Social) : null,
  ].filter((s): s is Social => s !== null);

  // tea and boba shops often only say so in `shop`, not `cuisine`
  const cuisine = (t.cuisine || "").split(";").map((s) => s.trim()).filter(Boolean);
  if (t.shop === "tea" && !cuisine.includes("tea")) cuisine.push("tea");
  if (t.shop === "bubble_tea" && !cuisine.includes("bubble_tea")) cuisine.push("bubble_tea");

  const cafe: Cafe = {
    id: `${p.type}-${p.id}`,
    source: "osm",
    name,
    street: road ? [number, road].filter(Boolean).join(" ") : null,
    neighbourhood: a.neighbourhood || a.suburb || a.quarter || t["addr:suburb"] || null,
    city: a.city || a.town || a.village || a.municipality || t["addr:city"] || null,
    country: a.country || null,
    lat: p.lat,
    lng: p.lng,
    hours: t.opening_hours || null,
    brand: t.brand || null,
    cuisine,
    wifi: ["wlan", "yes", "wifi", "free"].includes(t.internet_access || "") || t["internet_access:fee"] === "no",
    outdoorSeating: t.outdoor_seating === "yes",
    vegan: ["yes", "only", "limited"].includes(t["diet:vegan"] || ""),
    wheelchair: t.wheelchair === "yes",
    socials,
    menuUrl: safeUrl(t["website:menu"] || t["contact:menu"] || t["menu:url"] || t.menu_url) ?? null,
    tags: [],
    accent: ACCENTS[p.id % ACCENTS.length],
  };
  cafe.tags = inferTags(cafe);
  return cafe;
}

type NominatimPlace = {
  place_id: number;
  osm_type: "node" | "way" | "relation";
  osm_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  address?: Record<string, string>;
  extratags?: Record<string, string> | null;
};

const fromNominatim = (p: NominatimPlace): Cafe | null =>
  toCafe({ type: p.osm_type, id: p.osm_id, lat: Number(p.lat), lng: Number(p.lon), name: p.name, tags: p.extratags ?? {}, address: p.address });

/* ───────────── public API (all cached) ───────────── */

/** Turn "Tokyo" / "Kensington, London" into a point. */
export async function geocode(query: string): Promise<Place | null> {
  "use cache";
  cacheLife("weeks");
  const [hit] = await nominatim<NominatimPlace[]>("/search", { q: query, limit: "1", addressdetails: "1" });
  if (!hit) return null;
  const a = hit.address ?? {};
  const name = hit.name || query;
  const country = a.country && a.country !== name ? a.country : null;
  return { name, label: country ? `${name}, ${country}` : name, lat: Number(hit.lat), lng: Number(hit.lon) };
}

export type Address = { street: string | null; neighbourhood: string | null; city: string | null; country: string | null };

/** The address at a point, for cafes people add themselves. */
export async function reverseGeocode(lat: number, lng: number): Promise<Address | null> {
  "use cache";
  cacheLife("weeks");
  const hit = await nominatim<NominatimPlace & { error?: string }>("/reverse", {
    lat: String(lat),
    lon: String(lng),
    zoom: "18",
    addressdetails: "1",
  });
  if (!hit || hit.error) return null;
  const a = hit.address ?? {};
  return {
    street: a.road ? [a.house_number, a.road].filter(Boolean).join(" ") : null,
    neighbourhood: a.neighbourhood || a.suburb || a.quarter || null,
    city: a.city || a.town || a.village || a.municipality || null,
    country: a.country || null,
  };
}

const CAFE_TYPES = new Set(["cafe", "coffee", "tea", "bubble_tea", "bakery", "pastry", "ice_cream", "fast_food", "confectionery"]);

/**
 * Cafes by name, for when Photon (the usual name search) is down. Nominatim
 * needs the words spelled right, so this only catches the easy cases.
 */
export async function cafesByName(q: string): Promise<Cafe[]> {
  "use cache";
  cacheLife("days");
  const hits = await nominatim<(NominatimPlace & { type?: string })[]>("/search", { q, limit: "15", extratags: "1", addressdetails: "1" });
  return dedupeCafes(hits.filter((h) => CAFE_TYPES.has(h.type ?? "")).map(fromNominatim).filter((c): c is Cafe => c !== null));
}

/**
 * Nominatim returns at most 50 per call, so keep paging (excluding what we
 * already have) until a page comes back short: up to 2 pages for 1 km, 3 for
 * 3 km and 4 for 8 km, at one request a second.
 */
export async function cafesNear(lat: number, lng: number, radiusKm: number): Promise<Cafe[]> {
  "use cache";
  cacheLife("days");
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  const viewbox = [lng - dLng, lat + dLat, lng + dLng, lat - dLat].map((n) => n.toFixed(5)).join(",");
  const base = { amenity: "cafe", limit: "50", extratags: "1", addressdetails: "1", bounded: "1", viewbox };

  const maxPages = radiusKm <= 1 ? 2 : radiusKm <= 3 ? 3 : 4;
  const all: NominatimPlace[] = [];
  for (let page = 0; page < maxPages; page++) {
    const params = all.length ? { ...base, exclude_place_ids: all.map((p) => p.place_id).join(",") } : base;
    const batch = await nominatim<NominatimPlace[]>("/search", params);
    all.push(...batch);
    if (batch.length < 50) break;
  }
  return dedupeCafes(
    all.map(fromNominatim).filter((c): c is Cafe => c !== null && distanceKm(lat, lng, c.lat, c.lng) <= radiusKm * 1.05),
  );
}

/** How much a listing tells us, so the fuller copy of a duplicate wins. */
const richness = (c: Cafe) =>
  (c.hours ? 2 : 0) + (c.street ? 1 : 0) + c.socials.length + c.cuisine.length + (c.brand ? 1 : 0);

export const sameName = (n: string) => n.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, "");

/**
 * OSM often has one cafe mapped twice (a pin plus the building, or two pins
 * a few doors apart). Drop repeats: same id, or same name within ~80 m.
 * Real chain branches further apart stay.
 */
export function dedupeCafes(cafes: Cafe[]): Cafe[] {
  const kept: Cafe[] = [];
  const ids = new Set<string>();
  for (const c of cafes) {
    if (ids.has(c.id)) continue;
    ids.add(c.id);
    const key = sameName(c.name);
    const i = kept.findIndex((k) => sameName(k.name) === key && distanceKm(k.lat, k.lng, c.lat, c.lng) < 0.08);
    if (i === -1) kept.push(c);
    else if (richness(c) > richness(kept[i])) kept[i] = c;
  }
  return kept;
}

/** One OSM cafe by its URL id, e.g. "node-123456". */
export async function osmCafeById(id: string): Promise<Cafe | null> {
  "use cache";
  cacheLife("days");
  const m = /^(node|way|relation)-(\d+)$/.exec(id);
  if (!m) return null;
  const osmId = `${m[1][0].toUpperCase()}${m[2]}`;
  const [hit] = await nominatim<NominatimPlace[]>("/lookup", { osm_ids: osmId, extratags: "1", addressdetails: "1" });
  return hit ? fromNominatim(hit) : null;
}

/* ───────────── geometry ───────────── */

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Round to ~110 m — better cache hits, and we never handle anyone's exact location. */
export const roundCoord = (n: number) => Math.round(n * 1000) / 1000;
