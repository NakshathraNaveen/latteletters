import "server-only";
import { englishDataset, englishRecommendedTransformers, RegExpMatcher } from "obscenity";
import { supabaseAdmin } from "./supabase/admin";

const matcher = new RegExpMatcher({ ...englishDataset.build(), ...englishRecommendedTransformers });

/** True if the text contains profanity (also catches l33t-speak and spacing tricks). */
export const isProfane = (text: string) => matcher.hasMatch(text);

export const LIMITS = {
  postsPerHour: 5,
  notesPerCafePerDay: 3,
  reviewMax: 2000,
  noteMax: 280,
  photos: 3,
  photoBytes: 2 * 1024 * 1024,
};

/** Returns a friendly reason if this person is posting too fast, else null. */
export async function rateLimitReason(userId: string, cafeId: string, kind: "review" | "note") {
  const db = supabaseAdmin();
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count: lastHour } = await db.from("posts").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", hourAgo);
  if ((lastHour ?? 0) >= LIMITS.postsPerHour) return "You've pinned a lot this hour! Take a sip and try again a little later.";

  if (kind === "note") {
    const dayAgo = new Date(Date.now() - 86400_000).toISOString();
    const { count } = await db
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("cafe_id", cafeId)
      .eq("kind", "note")
      .gte("created_at", dayAgo);
    if ((count ?? 0) >= LIMITS.notesPerCafePerDay) return "That's 3 love notes for this cafe today. Save some sweetness for tomorrow!";
  }
  return null;
}
