"use server";

import { requireProfile } from "@/lib/auth";
import { cafeById } from "@/lib/osm";
import { MAX_SAVED } from "@/lib/saved";
import { supabaseAdmin } from "@/lib/supabase/admin";

const CAFE_ID = /^(node|way|relation)-\d{1,15}$/;

export type SaveState = { saved: boolean; error?: string };

/** Save or unsave a cafe for the logged-in person. `save` is the state they want. */
export async function setSaved(cafeId: string, save: boolean): Promise<SaveState> {
  const user = await requireProfile(`/cafe/${cafeId}`);
  if (typeof cafeId !== "string" || !CAFE_ID.test(cafeId)) return { saved: !save, error: "That cafe doesn't look right." };
  const db = supabaseAdmin().from("saved_cafes");

  if (!save) {
    const { error } = await db.delete().eq("user_id", user.id).eq("cafe_id", cafeId);
    return error ? { saved: true, error: "Couldn't unsave it. Try again?" } : { saved: false };
  }

  const { count } = await supabaseAdmin().from("saved_cafes").select("cafe_id", { count: "exact", head: true }).eq("user_id", user.id);
  if ((count ?? 0) >= MAX_SAVED) return { saved: false, error: `Your list is full (${MAX_SAVED} cafes). Unsave a few first.` };

  // the snapshot comes from OpenStreetMap (cached), never from the browser
  const cafe = await cafeById(cafeId).catch(() => null);
  if (!cafe) return { saved: false, error: "Couldn't find this cafe on the map right now. Try again in a moment." };
  const place = [cafe.neighbourhood, cafe.city].filter(Boolean).join(", ") || cafe.country || null;

  const { error } = await db.upsert(
    { user_id: user.id, cafe_id: cafeId, name: cafe.name.slice(0, 200), place: place?.slice(0, 200) ?? null, accent: cafe.accent },
    { onConflict: "user_id,cafe_id", ignoreDuplicates: true },
  );
  return error ? { saved: false, error: "Couldn't save it. Try again?" } : { saved: true };
}
