// MapLibre 6 runs map rendering in a web worker it finds next to its own
// script. Once bundled, that file isn't there, so we serve it from /public
// (named with the version, so upgrades never mix files). Runs before
// `npm run dev` and `npm run build`.
import { copyFile, mkdir, readFile, readdir, rm } from "node:fs/promises";

const pkg = JSON.parse(await readFile(new URL("../node_modules/maplibre-gl/package.json", import.meta.url), "utf8"));
const outDir = new URL("../public/maplibre/", import.meta.url);
const name = `maplibre-gl-worker-${pkg.version}.mjs`;

await mkdir(outDir, { recursive: true });
for (const old of await readdir(outDir)) if (old !== name) await rm(new URL(old, outDir));
await copyFile(new URL("../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url), new URL(name, outDir));
console.log(`maplibre worker → public/maplibre/${name}`);
