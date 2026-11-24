import { cacheLife } from "next/cache";
import { supabasePublic } from "./supabase/public";

export type PersonResult = { username: string; avatar: string; reviews: number; createdAt: string };

/**
 * People by username: exact match first, then names starting with what you
 * typed, then names containing it. Only public profile fields; never emails.
 */
export async function searchPeople(raw: string): Promise<PersonResult[]> {
  "use cache";
  cacheLife("minutes");
  const q = raw.toLowerCase().replace(/^@/, "").replace(/[^a-z0-9_]/g, "").slice(0, 20);
  if (q.length < 2) return [];
  const like = q.replace(/_/g, "\\_"); // "_" is a LIKE wildcard
  const { data, error } = await supabasePublic()
    .from("profiles")
    .select("username, avatar, created_at, posts(count)")
    .ilike("username", `%${like}%`)
    .limit(50);
  if (error) throw new Error(error.message);
  type Row = { username: string; avatar: string; created_at: string; posts: { count: number }[] };
  const rank = (u: string) => (u === q ? 0 : u.startsWith(q) ? 1 : 2);
  return (data as unknown as Row[])
    .map((r) => ({ username: r.username, avatar: r.avatar, reviews: r.posts?.[0]?.count ?? 0, createdAt: r.created_at }))
    .sort((a, b) => rank(a.username) - rank(b.username) || b.reviews - a.reviews || a.username.localeCompare(b.username))
    .slice(0, 20);
}
