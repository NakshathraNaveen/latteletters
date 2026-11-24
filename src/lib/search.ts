/**
 * latteletters search (PRD FR-2, FR-3, FR-5, FR-6) — worldwide edition.
 *
 *  1. interpret(): normalise the query, greedily match the longest known
 *     phrases (drink aliases, vibe synonyms), fuzzy-match typos, prefix-match
 *     half-typed words. Words we can't place are returned as `unknown` — the
 *     search page treats those as a place ("matcha in tokyo") or a cafe name.
 *  2. rankCafes(): score real cafes (from OpenStreetMap) against what was
 *     understood, explain *why* each matched, and sort by score then distance.
 *
 * OSM has no menus, so drink matches are honest about how they matched:
 * "name mentions matcha", "bubble tea shop", or just "coffee shop".
 */

import { DRINKS, DRINK_CHIPS, DRINK_FAMILY, DRINK_IDS, DRINK_NAME_WORDS, type DrinkId } from "./drinks";
import { levenshtein } from "./match";
import type { Cafe } from "./types";

export { levenshtein };
import { VIBES, VIBE_IDS, VIBE_RULES, type VibeId } from "./vibes";

export type MatchKind = "exact" | "fuzzy" | "partial";

type Phrase = { type: "drink"; id: DrinkId; tokens: string[] } | { type: "vibe"; id: VibeId; tokens: string[] };

export type Interpretation = {
  drinks: { id: DrinkId; kind: MatchKind; typed: string }[];
  vibes: VibeId[];
  /** words we couldn't place, in order — maybe a city or a cafe name */
  unknown: string[];
};

export type ScoredCafe = { cafe: Cafe; score: number; reasons: string[] };

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "for", "with", "to", "of", "on", "at", "me", "my",
  "i", "im", "want", "need", "some", "something", "spot", "spots", "place", "places", "cafe", "cafes",
  "coffee", "shop", "shops", "good", "best", "nice", "really", "very", "that", "has", "serves", "serve", "please",
]);
/** location connectors — "matcha in tokyo", "cafes near shibuya" */
const PLACE_WORDS = new Set(["in", "near", "around", "by"]);

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9À-￿]+/g, " ")
    .trim();
}

const tokenize = (s: string) => (s ? normalize(s).split(" ").filter(Boolean) : []);

const PHRASES: Phrase[] = [
  ...DRINK_IDS.flatMap((id) => DRINKS[id].aliases.map((a) => ({ type: "drink" as const, id, tokens: tokenize(a) }))),
  ...VIBE_IDS.flatMap((id) => VIBES[id].synonyms.map((s) => ({ type: "vibe" as const, id, tokens: tokenize(s) }))),
].sort((a, b) => b.tokens.length - a.tokens.length || b.tokens.join(" ").length - a.tokens.join(" ").length);


const tolerance = (len: number) => (len <= 4 ? 0 : len <= 8 ? 1 : 2);

export function interpret(query: string): Interpretation {
  const tokens = tokenize(query);
  const used = tokens.map(() => false);
  const drinks = new Map<DrinkId, { kind: MatchKind; typed: string }>();
  const vibes = new Set<VibeId>();

  const record = (p: Phrase, kind: MatchKind, typed: string) => {
    if (p.type === "vibe") return void vibes.add(p.id);
    const prev = drinks.get(p.id);
    const rank = { exact: 3, fuzzy: 2, partial: 1 };
    if (!prev || rank[kind] > rank[prev.kind]) drinks.set(p.id, { kind, typed });
  };
  const free = (i: number, n: number) => i + n <= tokens.length && used.slice(i, i + n).every((u) => !u);
  const consume = (i: number, n: number) => used.fill(true, i, i + n);

  // everything after "in"/"near" is a place, not a drink or vibe
  const placeAt = tokens.findIndex((t) => PLACE_WORDS.has(t));
  const limit = placeAt === -1 ? tokens.length : placeAt;
  if (placeAt !== -1) used[placeAt] = true;
  const inRange = (i: number, n: number) => i + n <= limit;

  // 1. exact phrases, longest first
  for (const p of PHRASES) {
    const n = p.tokens.length;
    for (let i = 0; inRange(i, n); i++) {
      if (free(i, n) && p.tokens.every((t, k) => tokens[i + k] === t)) {
        record(p, "exact", tokens.slice(i, i + n).join(" "));
        consume(i, n);
      }
    }
  }

  tokens.forEach((t, i) => {
    if (used[i]) return;
    if (i < limit && STOPWORDS.has(t)) used[i] = true;
    if (i > limit && ["me", "here", "us"].includes(t)) used[i] = true; // "near me" = use my location
  });

  // 2. fuzzy pass (3 words → 1 word)
  for (let n = 3; n >= 1; n--) {
    for (let i = 0; inRange(i, n); i++) {
      if (!free(i, n)) continue;
      const window = tokens.slice(i, i + n).join(" ");
      let best: { p: Phrase; d: number } | null = null;
      for (const p of PHRASES) {
        if (p.tokens.length !== n) continue;
        const target = p.tokens.join(" ");
        const d = levenshtein(window, target);
        if (d > 0 && d <= tolerance(target.length) && (!best || d < best.d)) best = { p, d };
      }
      if (best) {
        record(best.p, "fuzzy", window);
        consume(i, n);
      }
    }
  }

  // 3. prefix pass for half-typed drinks ("pista…") — only for the last word
  const last = limit - 1;
  if (last >= 0 && !used[last] && tokens[last].length >= 3) {
    const hits = PHRASES.filter((p) => p.type === "drink" && p.tokens[0].startsWith(tokens[last]));
    if (hits.length) {
      hits.forEach((p) => record(p, "partial", tokens[last]));
      used[last] = true;
    }
  }

  return {
    drinks: [...drinks].map(([id, v]) => ({ id, ...v })),
    vibes: [...vibes],
    unknown: tokens.filter((_, i) => !used[i]),
  };
}

/* ───────────── ranking real cafes ───────────── */

const BOBA_CUISINE = ["bubble_tea", "tea", "taiwanese"];
const TEA_CUISINE = ["tea", "bubble_tea", "japanese", "matcha"];
const COFFEE_CUISINE = ["coffee_shop", "coffee", "espresso"];

const nameHas = (name: string, words: string[]) => new RegExp(`\\b(${words.join("|")})`, "i").test(name);

/** How well a cafe fits a drink, with a reason. null = not a fit. */
function drinkFit(cafe: Cafe, id: DrinkId): { points: number; reason: string } | null {
  const label = DRINKS[id].name.toLowerCase();
  const words = DRINK_NAME_WORDS[id];
  if (words && nameHas(cafe.name, words)) return { points: 7, reason: `name says ${words.find((w) => nameHas(cafe.name, [w]))}` };

  const c = cafe.cuisine;
  switch (DRINK_FAMILY[id]) {
    case "boba":
      return c.some((x) => BOBA_CUISINE.includes(x)) ? { points: 6, reason: "bubble tea shop" } : null;
    case "tea":
      if (c.some((x) => TEA_CUISINE.includes(x))) return { points: 5, reason: "tea spot" };
      return c.length === 0 || c.some((x) => COFFEE_CUISINE.includes(x)) ? { points: 1, reason: `coffee shop (ask for a ${label}!)` } : null;
    case "sweet":
      return c.some((x) => ["ice_cream", "gelato", "dessert"].includes(x)) ? { points: 6, reason: "dessert spot" } : { points: 1, reason: "cafe" };
    default:
      if (c.some((x) => BOBA_CUISINE.includes(x)) && !c.some((x) => COFFEE_CUISINE.includes(x))) return null; // pure boba shop
      return c.some((x) => COFFEE_CUISINE.includes(x)) ? { points: 3, reason: "coffee shop" } : { points: 2, reason: "cafe" };
  }
}

/**
 * Score and sort cafes. `nameWords` are leftover words to match against
 * cafe names (when the place came from the "where" box).
 */
export function rankCafes(cafes: Cafe[], it: Interpretation, nameWords: string[] = []): { results: ScoredCafe[]; relaxed: boolean } {
  const nameQuery = nameWords.join(" ");
  const scored: ScoredCafe[] = [];

  for (const cafe of cafes) {
    let score = 0;
    const reasons: string[] = [];
    let fits = it.drinks.length === 0 && it.vibes.length === 0;

    if (nameQuery.length >= 3 && normalize(cafe.name).includes(nameQuery)) {
      score += 10;
      reasons.push("name match");
      fits = true;
    }

    // best drink fit only (don't double-count "matcha" + "matcha latte")
    let best: { points: number; reason: string } | null = null;
    for (const d of it.drinks) {
      const f = drinkFit(cafe, d.id);
      if (f && (!best || f.points > best.points)) best = f;
    }
    if (best) {
      score += best.points;
      reasons.push(best.reason);
      if (!it.vibes.length) fits = true;
    }

    const vibeReasons = it.vibes.map((v) => VIBE_RULES[v](cafe)).filter((r): r is string => r !== null);
    if (vibeReasons.length) {
      score += vibeReasons.length * 3;
      reasons.push(...new Set(vibeReasons));
      if (!it.drinks.length || best) fits = true;
    }

    if (!cafe.brand) score += 0.5; // a small nudge for independent cafes (PRD: help small cafes grow)

    if (fits) scored.push({ cafe, score, reasons });
  }

  const byDistance = (a: ScoredCafe, b: ScoredCafe) => (a.cafe.distanceKm ?? 0) - (b.cafe.distanceKm ?? 0);
  scored.sort((a, b) => b.score - a.score || byDistance(a, b));

  // nothing fit the vibe → show everything nearby, closest first, and say so
  if (!scored.length && it.vibes.length && !nameQuery) {
    return {
      results: cafes.map((cafe) => ({ cafe, score: 0, reasons: [] })).sort(byDistance),
      relaxed: true,
    };
  }
  return { results: scored, relaxed: false };
}

/** Empty-state suggestions (FR-6): closest drink names, padded with popular picks. */
export function suggest(query: string): DrinkId[] {
  const nq = normalize(query);
  const ranked = DRINK_IDS.map((id) => ({
    id,
    d: Math.min(...DRINKS[id].aliases.map((a) => levenshtein(nq, normalize(a)))),
  }))
    .filter((x) => nq && x.d <= Math.max(3, Math.floor(nq.length / 2)))
    .sort((a, b) => a.d - b.d)
    .map((x) => x.id);
  return [...new Set([...ranked, ...DRINK_CHIPS])].slice(0, 4);
}
