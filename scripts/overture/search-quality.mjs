// How forgiving is "find the cafe you went to"? Takes random real cafes from
// the database, misspells their names the way people do, and checks the right
// cafe comes back near the top. Uses the same database search and the same
// ranking (src/lib/match.ts) as the website.
//
//   cd scripts/overture && node --env-file=../../.env.local search-quality.mjs [samples]
import pg from "pg";

const { matchScore, foldText } = await import("../../src/lib/match.ts");

const SAMPLES = Number(process.argv[2] ?? 300);
const url = new URL(process.env.POSTGRES_URL_NON_POOLING);
url.searchParams.delete("sslmode");
const db = new pg.Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
await db.connect();
await db.query("set statement_timeout = '12s'");

/* ───────────── deterministic randomness, so runs are comparable ───────────── */
let seed = 42;
const rand = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
const pick = (xs) => xs[Math.floor(rand() * xs.length)];
const LETTERS = "abcdefghijklmnopqrstuvwxyz";

/** One realistic typo somewhere after the first letter. */
function typo(word) {
  if (word.length < 4) return word;
  const i = 1 + Math.floor(rand() * (word.length - 1));
  switch (pick(["drop", "swap", "replace", "double"])) {
    case "drop":
      return word.slice(0, i) + word.slice(i + 1);
    case "swap":
      return i < word.length - 1 ? word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2) : word.slice(0, -1);
    case "replace":
      return word.slice(0, i) + pick([...LETTERS]) + word.slice(i + 1);
    default:
      return word.slice(0, i) + word[i] + word.slice(i);
  }
}
const randomCase = (s) => [...s].map((c) => (rand() < 0.3 ? c.toUpperCase() : c.toLowerCase())).join("");

/** The ways people mistype a cafe's name. */
function variants(name, city) {
  const words = foldText(name).split(" ").filter(Boolean);
  const longest = words.reduce((a, w) => (w.length > a.length ? w : a), "");
  const withCity = (q) => (city ? `${q}, ${city.toLowerCase()}` : q);
  return {
    "lowercase": words.join(" "),
    "random caps": randomCase(name),
    "no spaces": words.join(""),
    "extra space": longest.length >= 6 ? words.map((w) => (w === longest ? `${w.slice(0, 3)} ${w.slice(3)}` : w)).join(" ") : words.join(" "),
    "1 typo": words.map((w) => (w === longest ? typo(w) : w)).join(" "),
    "1 typo + city": withCity(words.map((w) => (w === longest ? typo(w) : w)).join(" ")),
    "typo in every word": words.map(typo).join(" "),
    "typo every word + city": withCity(words.map(typo).join(" ")),
  };
}

/* ───────────── the website's search, minus the network ───────────── */
const GENTLE_MS = Number(process.env.GENTLE_MS ?? 0);
async function search(q, near) {
  const args = [q, near?.lat ?? null, near?.lng ?? null];
  let { rows } = await db.query("select * from public.search_overture_cafes($1, $2, $3, 120, false)", args);
  const good = rows.filter((r) => matchScore(q, r.name, [r.street, r.city].filter(Boolean).join(", ")) >= 0.6).length;
  if (good < 3) {
    const more = (await db.query("select * from public.search_overture_cafes($1, $2, $3, 120, true)", args)).rows;
    const seen = new Set(rows.map((r) => r.id));
    rows = [...rows, ...more.filter((r) => !seen.has(r.id))];
  }
  if (GENTLE_MS) await new Promise((r) => setTimeout(r, GENTLE_MS));
  // same order as findCafes: clearly better match first, close calls to the nearer cafe
  const km = (r) => (near ? Math.hypot(r.lat - near.lat, (r.lng - near.lng) * Math.cos((near.lat * Math.PI) / 180)) : 0);
  return rows
    .map((r) => ({ id: r.id, km: km(r), score: matchScore(q, r.name, [r.street, r.city].filter(Boolean).join(", ")) }))
    .filter((r) => r.score >= 0.45)
    .sort((a, b) => (Math.abs(b.score - a.score) > 0.08 ? b.score - a.score : 0) || a.km - b.km)
    .map((r) => r.id);
}

/* ───────────── run ───────────── */
const { rows: sample } = await db.query(
  `select id, name, city, lat, lng from public.overture_cafes tablesample system (0.3) repeatable (11)
    where char_length(name) between 4 and 40 and name ~ '[A-Za-z]' limit $1`,
  [SAMPLES],
);
console.log(`testing ${sample.length} random cafes…`);

const stats = {};
const misses = [];
let slowest = 0;
for (const cafe of sample) {
  const only = process.env.KINDS?.split(",");
  for (const [kind, q] of Object.entries(variants(cafe.name, cafe.city)).filter(([k]) => !only || only.includes(k))) {
    for (const where of (process.env.WHERE ?? "anywhere,near me").split(",")) {
      const near = where === "near me" ? { lat: Math.round(cafe.lat * 100) / 100, lng: Math.round(cafe.lng * 100) / 100 } : null;
      const t = Date.now();
      const ids = await search(q, near);
      slowest = Math.max(slowest, Date.now() - t);
      const rank = ids.indexOf(cafe.id);
      const key = `${kind} · ${where}`;
      stats[key] ??= { n: 0, top5: 0, top15: 0 };
      stats[key].n++;
      if (rank >= 0 && rank < 5) stats[key].top5++;
      if (rank >= 0 && rank < 15) stats[key].top15++;
      else if (misses.length < 25 && where === "near me") misses.push(`${kind}: "${q}" → wanted "${cafe.name}" (${cafe.city ?? "?"})`);
    }
  }
}

console.table(
  Object.fromEntries(
    Object.entries(stats).map(([k, s]) => [k, { "top 5": `${Math.round((100 * s.top5) / s.n)}%`, "top 15 (shown)": `${Math.round((100 * s.top15) / s.n)}%` }]),
  ),
);
console.log(`slowest search: ${slowest} ms`);
console.log("some misses (near me):\n  " + misses.join("\n  "));
await db.end();
