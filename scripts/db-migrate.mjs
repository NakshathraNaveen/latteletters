// Applies supabase/migrations/*.sql in order, once each.
// Usage: node --env-file=.env.local scripts/db-migrate.mjs
import { readdir, readFile } from "node:fs/promises";
import pg from "pg";

const raw = process.env.POSTGRES_URL_NON_POOLING;
if (!raw) throw new Error("POSTGRES_URL_NON_POOLING is not set (run `npx vercel env pull .env.local`)");

// Supabase uses its own CA; drop sslmode from the URL and configure TLS here.
const url = new URL(raw);
url.searchParams.delete("sslmode");
const client = new pg.Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
await client.connect();

await client.query(`create table if not exists public._migrations (name text primary key, applied_at timestamptz not null default now())`);
await client.query(`alter table public._migrations enable row level security`);
const done = new Set((await client.query("select name from public._migrations")).rows.map((r) => r.name));

const dir = new URL("../supabase/migrations/", import.meta.url);
for (const name of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()) {
  if (done.has(name)) {
    console.log(`skip  ${name}`);
    continue;
  }
  const sql = await readFile(new URL(name, dir), "utf8");
  await client.query("begin");
  try {
    await client.query(sql);
    await client.query("insert into public._migrations (name) values ($1)", [name]);
    await client.query("commit");
    console.log(`apply ${name}`);
  } catch (err) {
    await client.query("rollback");
    console.error(`FAILED ${name}: ${err.message}`);
    process.exitCode = 1;
    break;
  }
}
await client.end();
