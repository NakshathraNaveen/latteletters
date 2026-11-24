// Imports cafes from Overture Maps (https://overturemaps.org) into Supabase.
//
//   cd scripts/overture && npm install
//   npm run import -- --all                      # the whole world (~1.5M cafes)
//   npm run import -- --countries CA,US          # just some countries
//   npm run import -- --all --release 2026-11-18.0 --max-db-mb 460
//
// Reads Overture's public GeoParquet files straight from S3 with DuckDB (no
// account needed), keeps cafes, coffee shops, boba shops and tea rooms, and
// upserts them one country at a time. Cafes that disappeared from Overture
// since the last import (closed, merged) are removed. A full scan of the world
// takes ~10 minutes, mostly downloading.
//
// Safety: the free Supabase plan stops accepting writes past 500 MB, which
// would break reviews and sign-ups. So before each country we check the
// database size and stop at --max-db-mb (default 460). Countries are never
// half-imported; any left out simply keep using OpenStreetMap on the site.
//
// Licences: CDLA-Permissive-2.0 (Overture, Meta, Microsoft…), Apache-2.0
// (Foursquare), CC0 (AllThePlaces). The site credits Overture wherever it shows them.
import { DuckDBInstance } from "@duckdb/node-api";
import pg from "pg";

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const all = args.includes("--all");
const only = (arg("countries") ?? "")
  .split(",")
  .map((c) => c.trim().toUpperCase())
  .filter((c) => /^[A-Z]{2}$/.test(c));
if (!all && !only.length) {
  console.error("Say which countries: --countries CA,US  (or --all for the whole world)");
  process.exit(1);
}
const maxDbBytes = Number(arg("max-db-mb") ?? 460) * 1024 * 1024;

/** Overture's newest release, from its STAC catalogue. */
async function latestRelease() {
  const cat = await (await fetch("https://stac.overturemaps.org/catalog.json")).json();
  if (cat.latest) return cat.latest;
  return cat.links
    .filter((l) => l.rel === "child")
    .map((l) => l.href.split("/").at(-2))
    .sort()
    .at(-1);
}
const release = arg("release") ?? (await latestRelease());
if (!/^\d{4}-\d{2}-\d{2}\.\d+$/.test(release)) throw new Error(`odd release name: ${release}`);
const releaseDay = Number(release.slice(0, 10).replaceAll("-", ""));
console.log(`Overture release ${release} · ${all ? "whole world" : only.join(", ")} · stop at ${Math.round(maxDbBytes / 1048576)} MB`);

/* ───────────── 1. read Overture with DuckDB ───────────── */

// must match KINDS in src/lib/overture.ts
const KIND = { coffee_shop: 1, cafe: 2, bubble_tea_shop: 3, tea_room: 4, hong_kong_style_cafe: 5 };
const kindCase = `CASE taxonomy.primary ${Object.entries(KIND).map(([k, v]) => `WHEN '${k}' THEN ${v}`).join(" ")} ELSE 0 END`;

const duck = await (await DuckDBInstance.create(":memory:")).connect();
await duck.run("INSTALL httpfs; LOAD httpfs; SET s3_region='us-west-2'; SET threads=8;");
const SRC = `s3://overturemaps-us-west-2/release/${release}/theme=places/type=place/*.parquet`;
const where = all ? "" : `AND addresses[1].country IN (${only.map((c) => `'${c}'`).join(",")})`;

const started = Date.now();
await duck.run(`
  CREATE TABLE cafes AS
  SELECT
    id,
    ((bbox.ymin + bbox.ymax) / 2)::REAL                                AS lat,
    ((bbox.xmin + bbox.xmax) / 2)::REAL                                AS lng,
    ${kindCase}                                                        AS kind,
    confidence::REAL                                                   AS confidence,
    upper(addresses[1].country)                                        AS country,
    left(trim(names.primary), 200)                                     AS name,
    left(addresses[1].freeform, 200)                                   AS street,
    left(addresses[1].locality, 100)                                   AS city,
    left(brand.names.primary, 100)                                     AS brand,
    -- "https://www.example.com/" → "example.com" (the site adds https:// back)
    nullif(left(regexp_replace(regexp_replace(websites[1], '^https?://(www\\.)?', ''), '/$', ''), 200), '') AS website,
    regexp_extract(list_filter(socials, s -> s ILIKE '%instagram.com/%')[1], 'instagram\\.com/([A-Za-z0-9_.]{1,30})', 1) AS instagram
  FROM read_parquet('${SRC}')
  WHERE list_has_any(taxonomy.hierarchy, ['coffee_shop', 'cafe', 'bubble_tea_shop', 'tea_room'])
    AND taxonomy.primary <> 'internet_cafe'
    AND confidence >= 0.25                       -- real small cafes often score 0.3–0.5; below 0.25 is mostly noise
    AND coalesce(operating_status, 'open') = 'open'
    AND coalesce(trim(names.primary), '') <> ''
    ${where}
`);
const byCountry = (
  await duck.runAndReadAll("SELECT coalesce(country, '??') AS cc, count(*)::INTEGER AS n FROM cafes GROUP BY ALL ORDER BY n DESC")
).getRowObjectsJson();
const total = byCountry.reduce((a, r) => a + r.n, 0);
console.log(`read ${total} cafes in ${byCountry.length} countries from Overture in ${Math.round((Date.now() - started) / 1000)}s`);

/* ───────────── 2. upsert into Postgres, country by country ───────────── */

const raw = process.env.POSTGRES_URL_NON_POOLING;
if (!raw) throw new Error("POSTGRES_URL_NON_POOLING is not set (run `npx vercel env pull .env.local` in the project root)");
const url = new URL(raw);
url.searchParams.delete("sslmode");
const db = new pg.Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
await db.connect();

const COLS = ["id", "lat", "lng", "kind", "release_day", "confidence", "country", "name", "street", "city", "brand", "website", "instagram"];
const BATCH = 2000;
const dbSize = async () => Number((await db.query("select pg_database_size(current_database()) as b")).rows[0].b);

const imported = [];
const skipped = [];
let saved = 0;
for (const { cc, n } of byCountry) {
  const size = await dbSize();
  // rough cost of this country: ~280 bytes a cafe with indexes (existing rows are replaced, not added)
  if (size + n * 280 > maxDbBytes) {
    skipped.push(cc);
    continue;
  }
  const filter = cc === "??" ? "country IS NULL" : `country = '${cc}'`;
  for (let offset = 0; offset < n; offset += BATCH) {
    const chunk = (await duck.runAndReadAll(`SELECT * FROM cafes WHERE ${filter} ORDER BY id LIMIT ${BATCH} OFFSET ${offset}`)).getRowObjectsJson();
    const values = [];
    const params = [];
    for (const r of chunk) {
      const row = [r.id, r.lat, r.lng, r.kind, releaseDay, r.confidence, r.country, r.name, r.street, r.city, r.brand, r.website, r.instagram];
      values.push(`(${row.map((_, j) => `$${params.length + j + 1}`).join(",")})`);
      params.push(...row.map((v) => (v === undefined || v === "" ? null : v)));
    }
    await db.query(
      `insert into public.overture_cafes (${COLS.join(",")}) values ${values.join(",")}
       on conflict (id) do update set ${COLS.filter((c) => c !== "id").map((c) => `${c} = excluded.${c}`).join(", ")}`,
      params,
    );
  }
  imported.push(cc);
  saved += n;
  if (imported.length % 10 === 0 || n > 20000) console.log(`  ${cc}: ${n} · ${saved}/${total} saved · db ${Math.round((await dbSize()) / 1048576)} MB`);
}

/* ───────────── 3. drop cafes that are gone from Overture ───────────── */

const done = imported.filter((c) => c !== "??");
const gone = await db.query(
  `delete from public.overture_cafes where release_day <> $1 and (country = any($2) ${imported.includes("??") ? "or country is null" : ""})`,
  [releaseDay, done],
);
console.log(`removed ${gone.rowCount} cafes no longer in Overture`);
if (skipped.length) console.log(`⚠ stopped before the size limit; not imported (they keep using OpenStreetMap): ${skipped.join(", ")}`);

const summary = await db.query(
  `select (select count(*)::int from public.overture_cafes) as cafes,
          pg_size_pretty(pg_total_relation_size('public.overture_cafes')) as table_size,
          pg_size_pretty(pg_database_size(current_database())) as database_size`,
);
console.log(summary.rows[0]);
await db.end();
