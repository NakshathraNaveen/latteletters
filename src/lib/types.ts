import type { VibeId } from "./vibes";

export type SocialPlatform = "instagram" | "tiktok" | "facebook" | "website";

export type Social = {
  platform: SocialPlatform;
  handle: string;
  url: string;
};

/**
 * A real cafe: from Overture Maps, OpenStreetMap (© OpenStreetMap
 * contributors), or added by someone on latteletters.
 * Prices and photos aren't in the data; a menu link sometimes is (OSM).
 */
export type Cafe = {
  /** URL-safe id: Overture "o-<uuid>", OSM "node-123456", or community "c-<uuid>" */
  id: string;
  source: "overture" | "osm" | "community";
  /** community cafes: who added it (null once their account is deleted) */
  addedBy?: string | null;
  name: string;
  /** best-effort street address, e.g. "334 Dundas Street West" */
  street: string | null;
  neighbourhood: string | null;
  city: string | null;
  country: string | null;
  lat: number;
  lng: number;
  /** raw OSM opening_hours string, e.g. "Mo-Fr 08:00-18:00; Sa 09:00-17:00" */
  hours: string | null;
  /** chain name if it's a chain (OSM `brand`), null for independents */
  brand: string | null;
  /** OSM cuisine values, e.g. ["coffee_shop", "bubble_tea"] */
  cuisine: string[];
  wifi: boolean;
  outdoorSeating: boolean;
  vegan: boolean;
  wheelchair: boolean;
  socials: Social[];
  /** link to the cafe's own menu, when the map has one (OSM website:menu etc.) */
  menuUrl?: string | null;
  /** vibe tags we can infer from the data (see lib/vibes.ts for the rules) */
  tags: VibeId[];
  /** colour for the cafe's ID card */
  accent: "hotpink" | "lavender" | "olive" | "lime" | "lemon";
  /** filled in when results are sorted around a point */
  distanceKm?: number;
};

export type Place = {
  name: string;
  /** short label like "Toronto, Canada" */
  label: string;
  lat: number;
  lng: number;
};
