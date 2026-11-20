/**
 * Vibe / mood tags (PRD FR-4, FR-5).
 *
 * OpenStreetMap has no "cozy" or "aesthetic" field, so each vibe is inferred
 * from real clues in the data (wifi, outdoor seating, opening hours, chain vs
 * independent, Instagram, cuisine, name). Every rule returns a short,
 * honest reason that's shown on the result card ("has wifi", "open late").
 */

import type { DrinkId } from "./drinks";
import type { Cafe } from "./types";

export type VibeId =
  | "cozy"
  | "study"
  | "date"
  | "aesthetic"
  | "quiet"
  | "late-night"
  | "patio"
  | "plants"
  | "vegan"
  | "dessert";

export type VibeInfo = {
  label: string;
  emoji: string;
  synonyms: string[];
  /** plain-English description of what the rule looks for */
  lookFor: string;
};

export const VIBES: Record<VibeId, VibeInfo> = {
  cozy: {
    label: "cozy",
    emoji: "🧸",
    synonyms: ["cozy", "cosy", "comfy", "warm", "rainy day", "rainy", "snug"],
    lookFor: "independent cafes & cozy-sounding names",
  },
  study: {
    label: "study",
    emoji: "📚",
    synonyms: ["study", "studying", "work", "laptop", "wifi", "outlets", "homework"],
    lookFor: "cafes with wifi & bookish spots",
  },
  date: {
    label: "date",
    emoji: "💌",
    synonyms: ["date", "date night", "romantic", "first date"],
    lookFor: "independent spots with sweets, wine or late hours",
  },
  aesthetic: {
    label: "aesthetic",
    emoji: "📸",
    synonyms: ["aesthetic", "pretty", "cute", "instagrammable", "photo", "photos", "pinterest"],
    lookFor: "cafes on Instagram & pretty names",
  },
  quiet: {
    label: "quiet",
    emoji: "🤫",
    synonyms: ["quiet", "calm", "peaceful", "chill", "silent"],
    lookFor: "tea houses & slow, bookish cafes",
  },
  "late-night": {
    label: "late-night",
    emoji: "🌙",
    synonyms: ["late night", "late-night", "open late", "night", "evening"],
    lookFor: "cafes open past 9pm",
  },
  patio: {
    label: "patio",
    emoji: "☀️",
    synonyms: ["patio", "outdoor", "outside", "sunny", "terrace"],
    lookFor: "outdoor seating",
  },
  plants: {
    label: "plants",
    emoji: "🌿",
    synonyms: ["plants", "plant", "green", "leafy"],
    lookFor: "garden-y, leafy names",
  },
  vegan: {
    label: "vegan options",
    emoji: "🌱",
    synonyms: ["vegan", "plant based", "dairy free"],
    lookFor: "cafes tagged with vegan options",
  },
  dessert: {
    label: "dessert",
    emoji: "🍰",
    synonyms: ["dessert", "sweet", "pastry", "pastries", "cake", "treat"],
    lookFor: "bakeries, cake & gelato spots",
  },
};

export const VIBE_IDS = Object.keys(VIBES) as VibeId[];

/* ───────────── inference rules ───────────── */

const has = (name: string, words: string[]) => new RegExp(`\\b(${words.join("|")})`, "i").test(name);
const DESSERT_CUISINE = ["cake", "dessert", "ice_cream", "crepe", "waffle", "pastry", "donut", "bakery", "patisserie", "frozen_yogurt"];
const SWEET_WORDS = ["cake", "patisserie", "p[aâ]tisserie", "bakery", "boulangerie", "gelato", "dessert", "donut", "doughnut", "cr[eê]pe", "waffle", "sweet", "sugar"];

/** true if any opening-hours range ends at/after 21:00, runs past midnight, or is 24/7 */
export function closesLate(hours: string | null): boolean {
  if (!hours) return false;
  if (/24\/7/.test(hours)) return true;
  for (const [, s, e] of hours.matchAll(/(\d{1,2}):\d{2}\s*-\s*(\d{1,2}):\d{2}/g)) {
    const start = Number(s);
    const end = Number(e);
    if (end >= 21 || end < start) return true;
  }
  return false;
}

const isSweet = (c: Cafe) => c.cuisine.some((x) => DESSERT_CUISINE.includes(x)) || has(c.name, SWEET_WORDS);

/** Each rule returns a reason string when the cafe fits the vibe, else null. */
export const VIBE_RULES: Record<VibeId, (c: Cafe) => string | null> = {
  cozy: (c) => (has(c.name, ["cozy", "cosy", "nook", "hearth", "home", "den", "cottage", "hygge", "corner", "little"]) ? "sounds cozy" : !c.brand ? "independent, not a chain" : null),
  study: (c) => (c.wifi ? "has wifi" : has(c.name, ["book", "library", "study", "reading", "letters?"]) ? "bookish" : null),
  date: (c) => {
    if (c.brand) return null;
    if (isSweet(c)) return "sweet treats";
    if (closesLate(c.hours)) return "open late";
    if (has(c.name, ["wine", "bistro", "candle", "amour", "love"])) return "date-night name";
    return null;
  },
  aesthetic: (c) =>
    c.socials.some((s) => s.platform === "instagram")
      ? "on Instagram"
      : has(c.name, ["studio", "bloom", "flower", "fleur", "rose", "pink", "garden", "atelier", "petal", "cloud"])
        ? "pretty name"
        : null,
  quiet: (c) =>
    c.cuisine.includes("tea") || has(c.name, ["tea ?house", "teahouse", "book", "library", "reading", "zen", "slow", "still"])
      ? "calm, tea-house energy"
      : null,
  "late-night": (c) => (closesLate(c.hours) ? "open late" : null),
  patio: (c) => (c.outdoorSeating ? "outdoor seating" : null),
  plants: (c) => (has(c.name, ["plant", "garden", "green", "leaf", "fern", "botan", "flora", "bloom", "moss", "jungle"]) ? "leafy name" : null),
  vegan: (c) => (c.vegan ? "vegan options" : null),
  dessert: (c) => (isSweet(c) ? "sweet treats" : null),
};

export function inferTags(c: Cafe): VibeId[] {
  return VIBE_IDS.filter((v) => VIBE_RULES[v](c) !== null);
}

/* ───────────── UI lists ───────────── */

/** "Can't decide?" mood folders: one folder per mood, browsable by tab. */
export const MOOD_FOLDERS: {
  vibe: VibeId;
  title: string;
  note: string;
  drink: DrinkId;
  folder: string;
  ink: string;
}[] = [
  { vibe: "cozy", title: "cozy", note: "for rainy days, big sweaters & long books", drink: "london-fog", folder: "bg-lemon", ink: "text-cola" },
  { vibe: "study", title: "study", note: "outlets, wifi & a cold brew that means business", drink: "cold-brew", folder: "bg-[#e8c6d4]", ink: "text-cola" },
  { vibe: "date", title: "date", note: "candlelight, shared desserts & butterflies", drink: "affogato", folder: "bg-hotpink", ink: "text-cola" },
  { vibe: "aesthetic", title: "aesthetic", note: "the pretty cups your camera roll deserves", drink: "strawberry-matcha", folder: "bg-lavender", ink: "text-cola" },
  { vibe: "quiet", title: "quiet", note: "soft music, soft light & even softer thoughts", drink: "hojicha-latte", folder: "bg-[#c5d28a]", ink: "text-cola" },
  { vibe: "late-night", title: "late night", note: "midnight study sessions & neon signs", drink: "dirty-chai", folder: "bg-cola", ink: "text-cotton" },
];

/** Mood chips under the search bar (FR-4). "aesthetic-but-quiet" is a combo chip. */
export const MOOD_CHIPS: { label: string; query: string; emoji: string }[] = [
  { label: "cozy", query: "cozy", emoji: "🧸" },
  { label: "study", query: "study", emoji: "📚" },
  { label: "date", query: "date", emoji: "💌" },
  { label: "aesthetic", query: "aesthetic", emoji: "📸" },
  { label: "aesthetic-but-quiet", query: "aesthetic quiet", emoji: "🤍" },
];
