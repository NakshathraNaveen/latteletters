/**
 * Click-through tracking (FR-10). MVP: validate and log, so events show up
 * in Vercel's function logs. Phase 2: insert into a Supabase `events` table.
 */
import { CAFE_ID } from "@/lib/cafes";

const PLATFORMS = new Set(["instagram", "tiktok", "facebook", "website"]);

export async function POST(request: Request) {
  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const { event, cafeId, platform } = (data ?? {}) as Record<string, unknown>;
  if (event !== "social_click" || typeof platform !== "string" || !PLATFORMS.has(platform) || typeof cafeId !== "string" || !CAFE_ID.test(cafeId)) {
    return new Response("invalid event", { status: 400 });
  }

  console.info(`[track] social_click cafe=${cafeId} platform=${platform}`);
  return new Response(null, { status: 204 });
}
