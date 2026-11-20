import type { VibeId } from "./vibes";

export type SocialPlatform = "instagram" | "tiktok" | "facebook" | "website";

export type Social = {
  platform: SocialPlatform;
  handle: string;
  url: string;
};

/**
 * A real cafe, built from OpenStreetMap data (© OpenStreetMap contributors).
 * OSM has no menus, prices or photos, so those aren't part of the model.
 */
export type Cafe = {
  /** URL-safe OSM reference, e.g. "node-123456" */
  id: string;
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
