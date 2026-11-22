import "server-only";
import type { Cafe } from "./types";
import { supabaseAdmin } from "./supabase/admin";

/** A saved cafe, from the snapshot taken when it was saved (no map lookup needed). */
export type SavedCafe = { cafeId: string; name: string; place: string | null; accent: Cafe["accent"]; savedAt: string };

export const MAX_SAVED = 500;

/** Which of these cafes has this person saved? Per request (saves are private). */
export async function savedIds(userId: string, cafeIds?: string[]): Promise<Set<string>> {
  let query = supabaseAdmin().from("saved_cafes").select("cafe_id").eq("user_id", userId);
  if (cafeIds) {
    if (!cafeIds.length) return new Set();
    query = query.in("cafe_id", cafeIds);
  }
  const { data } = await query.limit(MAX_SAVED);
  return new Set((data ?? []).map((r) => r.cafe_id as string));
}

/** savedIds that never throws: hearts just show as unsaved if the database hiccups. */
export async function savedIdsSafe(userId: string | undefined, cafeIds?: string[]): Promise<Set<string> | null> {
  if (!userId) return null;
  try {
    return await savedIds(userId, cafeIds);
  } catch {
    return new Set();
  }
}

export async function savedCafes(userId: string): Promise<SavedCafe[]> {
  const { data, error } = await supabaseAdmin()
    .from("saved_cafes")
    .select("cafe_id, name, place, accent, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_SAVED);
  if (error) throw error;
  return (data ?? []).map((r) => ({ cafeId: r.cafe_id, name: r.name, place: r.place, accent: r.accent, savedAt: r.created_at }));
}
