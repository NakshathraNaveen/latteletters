/**
 * GET /api/cafes/find?q=pilot coffee&lat=43.65&lng=-79.38
 * Cafes by name, for the "find the cafe you went to" box. Location is
 * optional, only nudges the ranking, and is rounded to ~1 km.
 */
import { findCafes } from "@/lib/cafes";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = (params.get("q") ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  if (q.length < 2) return Response.json({ cafes: [], mapFailed: false });

  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  const near =
    params.get("lat") && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
      ? { lat: Math.round(lat * 100) / 100, lng: Math.round(lng * 100) / 100 }
      : null;

  const result = await findCafes(q, near);
  return Response.json(result, { headers: { "Cache-Control": "public, max-age=300" } });
}
