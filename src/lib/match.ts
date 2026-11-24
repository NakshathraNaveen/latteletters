/**
 * Forgiving cafe-name matching, shared by search-by-name (lib/cafes.ts) and
 * the quality test in scripts/search-quality.mts. No imports, so the test
 * can load it straight into Node.
 */

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** "LA LA Bakeshop, Waterloo" → "la la bakeshop waterloo" (no accents, no punctuation). */
export const foldText = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
export const wordsOf = (s: string) => foldText(s).split(" ").filter(Boolean);

/** Words that are in half of all cafe names: they count, but only a little. */
const COMMON = new Set(["coffee", "cafe", "caffe", "tea", "shop", "the", "and", "bar", "house", "co", "company", "bakery", "roasters", "roastery", "espresso", "kitchen", "de", "la", "le", "el", "a", "of"]);
/** How many typos a word can have and still count: none for short words. */
const typosAllowed = (len: number) => (len <= 3 ? 0 : len <= 6 ? 1 : 2);

/** How well one typed word matches a list of words (1 = exactly). */
function wordMatch(w: string, words: string[], squashed: string): number {
  let best = 0;
  for (const t of words) {
    if (t === w) return 1;
    if (w.length >= 2 && t.startsWith(w)) best = Math.max(best, 0.9); // still typing
    const tol = typosAllowed(w.length);
    if (tol) {
      if (levenshtein(w, t) <= tol) best = Math.max(best, 0.75); // "bakshop" → "bakeshop"
      else if (t.length > w.length && levenshtein(w, t.slice(0, w.length)) <= tol) best = Math.max(best, 0.6); // typo while typing
    }
  }
  if (best < 0.85 && w.length >= 3 && squashed.includes(w)) best = 0.85; // "lala" → "la la"
  return best;
}

/**
 * 0–1: how well a search matches a cafe. Every typed word is looked for in
 * the name (full credit) or the address/city (some credit), allowing typos,
 * missing or extra spaces, capitals and accents. Common words like "coffee"
 * weigh less, so "lala bakeshop waterloo" ranks LA LA Bakeshop on top.
 */
export function matchScore(query: string, name: string, place: string): number {
  const qWords = wordsOf(query);
  if (!qWords.length) return 0;
  const nameWords = wordsOf(name);
  const nameSquashed = nameWords.join("");
  const placeWords = wordsOf(place);
  const placeSquashed = placeWords.join("");

  let got = 0;
  let total = 0;
  let nameHits = 0;
  for (const w of qWords) {
    const weight = COMMON.has(w) ? 0.35 : 1;
    const inName = wordMatch(w, nameWords, nameSquashed);
    const inPlace = 0.7 * wordMatch(w, placeWords, placeSquashed);
    if (inName >= 0.6) nameHits++;
    got += weight * Math.max(inName, inPlace);
    total += weight;
  }
  if (!nameHits) return 0; // matching only the city isn't a match
  // typed the whole name, spaces or not ("lalabakeshop", "la la bake shop")
  const qSquashed = qWords.join("");
  const bonus = nameSquashed.length >= 4 && qSquashed.includes(nameSquashed) ? 0.15 : 0;
  return Math.min(1, got / total + bonus);
}

