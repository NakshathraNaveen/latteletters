/**
 * MapLibre GL JS + OpenFreeMap tiles: free, no API key, no usage caps.
 * Only client components import this, and they call loadMapLibre() inside an
 * effect, so the (large) map library downloads only when a map is on screen.
 *
 * The OpenFreeMap "positron" style is recoloured to the latteletters palette
 * (cotton-candy land, lavender water, olive parks, cherry-cola labels).
 */
import type { StyleSpecification } from "maplibre-gl";

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

export const PALETTE = {
  land: "#fff1f6",
  residential: "#ffe6f0",
  building: "#ffd7e7",
  park: "#e4ecc4",
  water: "#cdc3f1",
  road: "#ffffff",
  roadCasing: "#f5bfd6",
  rail: "#dcb6c6",
  boundary: "#c9a3b4",
  label: "#47131c",
  halo: "#fff1f6",
};

let mod: Promise<typeof import("maplibre-gl")> | null = null;
let style: Promise<StyleSpecification> | null = null;

/** The library, with its web worker served from /public (see scripts/copy-maplibre-worker.mjs). */
export function loadMapLibre() {
  mod ??= import("maplibre-gl").then((m) => {
    m.setWorkerUrl(`/maplibre/maplibre-gl-worker-${m.getVersion()}.mjs`);
    return m;
  });
  return mod;
}

function colourFor(id: string, type: string): string | null {
  if (type === "background") return PALETTE.land;
  if (/water/.test(id)) return PALETTE.water;
  if (/park|wood|grass|landcover/.test(id)) return PALETTE.park;
  if (/residential|landuse/.test(id)) return PALETTE.residential;
  if (/building/.test(id)) return PALETTE.building;
  if (/rail/.test(id)) return PALETTE.rail;
  if (/boundary/.test(id)) return PALETTE.boundary;
  if (/casing/.test(id)) return PALETTE.roadCasing;
  if (/highway|road|aeroway|pier/.test(id)) return PALETTE.road;
  return null;
}

/** The OpenFreeMap style, recoloured. Fetched once per page view. */
export function pinkStyle(): Promise<StyleSpecification> {
  style ??= fetch(STYLE_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`map style ${r.status}`);
      return r.json() as Promise<StyleSpecification>;
    })
    .then((s) => {
      for (const layer of s.layers) {
        const paint = ((layer as { paint?: Record<string, unknown> }).paint ??= {});
        if (layer.type === "symbol") {
          paint["text-color"] = PALETTE.label;
          paint["text-halo-color"] = PALETTE.halo;
          continue;
        }
        const colour = colourFor(layer.id, layer.type);
        if (!colour) continue;
        if (layer.type === "background") paint["background-color"] = colour;
        else if (layer.type === "fill") paint["fill-color"] = colour;
        else if (layer.type === "line") paint["line-color"] = colour;
      }
      return s;
    })
    .catch((e) => {
      style = null; // try again next time
      throw e;
    });
  return style;
}

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const cupSvg = (fill: string) =>
  `<svg viewBox="0 0 40 48" width="34" height="41" aria-hidden="true">
    <ellipse cx="20" cy="45" rx="11" ry="2.5" fill="#47131c" opacity=".25"/>
    <path d="M7 12 H33 L30 42 Q20 45 10 42 Z" fill="${fill}" stroke="#47131c" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="5" y="8" width="30" height="6" rx="3" fill="#fffde9" stroke="#47131c" stroke-width="2.5"/>
    <path d="M24 8 L28 1" stroke="#47131c" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M20 31 C14 26 14 22 17 21.5 C18.5 21.2 20 22.5 20 23.5 C20 22.5 21.5 21.2 23 21.5 C26 22 26 26 20 31Z" fill="#fffde9"/>
  </svg>`;

export const heartSvg = `<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
  <path d="M20 36 C4 24 2 12 10 8 C15 6 19 9 20 12 C21 9 25 6 30 8 C38 12 36 24 20 36Z" fill="#f08cb8" stroke="#47131c" stroke-width="2.5" stroke-linejoin="round"/>
</svg>`;
