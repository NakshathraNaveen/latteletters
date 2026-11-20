/**
 * Live cafe data from OpenStreetMap via the Nominatim API.
 * Data © OpenStreetMap contributors, available under the ODbL.
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

const BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "latteletters/0.2 (personal cafe-finder project)";

/* ───────────── politeness: one request per second, per server instance ───────────── */

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
  const url = `${BASE}${path}?${new URLSearchParams({ format: "jsonv2", ...params })}`;
  const res = await throttle(() =>
    fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
      signal: AbortSignal.timeout(12_000),
    }),
  );
  if (!res.ok) throw new Error(`OpenStreetMap lookup failed (${res.status})`);
  return res.json() as Promise<T>;
}

/* ───────────── raw response shape (only the fields we use) ───────────── */

type RawPlace = {
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

/* ───────────── mapping helpers ───────────── */

const ACCENTS: Cafe["accent"][] = ["hotpink", "lavender", "olive", "lime", "lemon"];

function safeUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(candidate);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null; // never javascript: etc.
  } catch {
    return null;
  }
}

function social(platform: Social["platform"], raw: string | undefined, base: string): Social | null {
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

function toCafe(p: RawPlace): Cafe | null {
  const t = p.extratags ?? {};
  const a = p.address ?? {};
  const name = p.name || a.amenity || a.cafe;
  if (!name) return null; // unnamed cafes aren't useful to browse

  const id = `${p.osm_type}-${p.osm_id}`;
  const website = safeUrl(t.website || t["contact:website"] || t.url);
  const socials = [
    social("instagram", t["contact:instagram"] || t.instagram, "https://www.instagram.com/"),
    social("tiktok", t["contact:tiktok"] || t.tiktok, "https://www.tiktok.com/@"),
    social("facebook", t["contact:facebook"] || t.facebook, "https://www.facebook.com/"),
    website ? ({ platform: "website", url: website, handle: new URL(website).hostname.replace(/^www\./, "") } as Social) : null,
  ].filter((s): s is Social => s !== null);

  const cafe: Cafe = {
    id,
    name,
    street: a.road ? [a.house_number, a.road].filter(Boolean).join(" ") : null,
    neighbourhood: a.neighbourhood || a.suburb || a.quarter || null,
    city: a.city || a.town || a.village || a.municipality || null,
    country: a.country || null,
    lat: Number(p.lat),
    lng: Number(p.lon),
    hours: t.opening_hours || null,
    brand: t.brand || null,
    cuisine: (t.cuisine || "").split(";").map((s) => s.trim()).filter(Boolean),
    wifi: ["wlan", "yes", "wifi", "free"].includes(t.internet_access || "") || t["internet_access:fee"] === "no",
    outdoorSeating: t.outdoor_seating === "yes",
    vegan: ["yes", "only", "limited"].includes(t["diet:vegan"] || ""),
    wheelchair: t.wheelchair === "yes",
    socials,
    tags: [],
    accent: ACCENTS[p.osm_id % ACCENTS.length],
  };
  cafe.tags = inferTags(cafe);
  return cafe;
}

/* ───────────── public API (all cached) ───────────── */

/** Turn "Tokyo" / "Kensington, London" into a point. */
export async function geocode(query: string): Promise<Place | null> {
  "use cache";
  cacheLife("weeks");
  const [hit] = await nominatim<RawPlace[]>("/search", { q: query, limit: "1", addressdetails: "1" });
  if (!hit) return null;
  const a = hit.address ?? {};
  const name = hit.name || query;
  const country = a.country && a.country !== name ? a.country : null;
  return { name, label: country ? `${name}, ${country}` : name, lat: Number(hit.lat), lng: Number(hit.lon) };
}

/**
 * Cafes inside a box around a point. Nominatim returns at most 50 per call,
 * so wider searches fetch a second page.
 */
export async function cafesNear(lat: number, lng: number, radiusKm: number): Promise<Cafe[]> {
  "use cache";
  cacheLife("days");

  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  const viewbox = [lng - dLng, lat + dLat, lng + dLng, lat - dLat].map((n) => n.toFixed(5)).join(",");
  const base = { amenity: "cafe", limit: "50", extratags: "1", addressdetails: "1", bounded: "1", viewbox };

  const page1 = await nominatim<RawPlace[]>("/search", base);
  let all = page1;
  if (radiusKm > 1 && page1.length === 50) {
    const page2 = await nominatim<RawPlace[]>("/search", { ...base, exclude_place_ids: page1.map((p) => p.place_id).join(",") });
    all = [...page1, ...page2];
  }
  return all.map(toCafe).filter((c): c is Cafe => c !== null);
}

/** One cafe by its URL id, e.g. "node-123456". */
export async function cafeById(id: string): Promise<Cafe | null> {
  "use cache";
  cacheLife("days");
  const m = /^(node|way|relation)-(\d+)$/.exec(id);
  if (!m) return null;
  const osmId = `${m[1][0].toUpperCase()}${m[2]}`;
  const [hit] = await nominatim<RawPlace[]>("/lookup", { osm_ids: osmId, extratags: "1", addressdetails: "1" });
  return hit ? toCafe(hit) : null;
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
