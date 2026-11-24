import { cacheTag } from "next/cache";
import { DRINKS, type DrinkId } from "./drinks";
import { photoUrl, supabasePublic } from "./supabase/public";

export type PostKind = "review" | "note";

export type Post = {
  id: string;
  kind: PostKind;
  cafeId: string;
  cafeName: string;
  rating: number | null;
  drink: string | null;
  vibes: string[];
  body: string;
  /** storage paths */
  photos: string[];
  /** Spotify link in our stored form ("track:<id>"), see lib/spotify */
  song: string | null;
  songTitle: string | null;
  createdAt: string;
  edited: boolean;
  author: { id: string; username: string; avatar: string };
};

export const postsTag = (cafeId: string) => `posts:${cafeId}`;
export const userTag = (username: string) => `user:${username}`;

const COLUMNS = "id, kind, cafe_id, cafe_name, rating, drink, vibes, body, photos, song, song_title, created_at, updated_at, author:profiles!inner(id, username, avatar)";

type Row = {
  id: string;
  kind: PostKind;
  cafe_id: string;
  cafe_name: string;
  rating: number | null;
  drink: string | null;
  vibes: string[];
  body: string;
  photos: string[];
  song: string | null;
  song_title: string | null;
  created_at: string;
  updated_at: string;
  author: { id: string; username: string; avatar: string };
};

export const toPost = (r: Row): Post => ({
  id: r.id,
  kind: r.kind,
  cafeId: r.cafe_id,
  cafeName: r.cafe_name,
  rating: r.rating,
  drink: r.drink,
  vibes: r.vibes,
  body: r.body,
  photos: r.photos,
  song: r.song ?? null,
  songTitle: r.song_title ?? null,
  createdAt: r.created_at,
  edited: new Date(r.updated_at).getTime() - new Date(r.created_at).getTime() > 60_000,
  author: r.author,
});

/** Visible posts for a cafe, newest first. Cached until someone posts/edits there. */
export async function postsForCafe(cafeId: string): Promise<Post[]> {
  "use cache";
  cacheTag(postsTag(cafeId));
  const { data, error } = await supabasePublic()
    .from("posts")
    .select(COLUMNS)
    .eq("cafe_id", cafeId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data as unknown as Row[]).map(toPost);
}

export type PublicProfile = { id: string; username: string; avatar: string; createdAt: string };

/** A person's public profile + visible posts. */
export async function profileWithPosts(username: string): Promise<{ profile: PublicProfile; posts: Post[] } | null> {
  "use cache";
  cacheTag(userTag(username));
  const db = supabasePublic();
  const { data: p, error } = await db.from("profiles").select("id, username, avatar, created_at").eq("username", username).maybeSingle();
  if (error) throw new Error(error.message);
  if (!p) return null;
  const { data, error: e2 } = await db.from("posts").select(COLUMNS).eq("user_id", p.id).order("created_at", { ascending: false }).limit(100);
  if (e2) throw new Error(e2.message);
  return { profile: { id: p.id, username: p.username, avatar: p.avatar, createdAt: p.created_at }, posts: (data as unknown as Row[]).map(toPost) };
}

export const drinkName = (drink: string | null) => (drink ? (DRINKS[drink as DrinkId]?.name ?? drink) : null);
export const isDrinkId = (v: string): v is DrinkId => v in DRINKS;
export const photoUrls = (paths: string[]) => paths.map(photoUrl);

export const RECENT_TAG = "posts:recent";

/** Newest visible posts anywhere, for the home page wall. */
export async function recentPosts(limit = 4): Promise<Post[]> {
  "use cache";
  cacheTag(RECENT_TAG);
  const { data, error } = await supabasePublic().from("posts").select(COLUMNS).order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return (data as unknown as Row[]).map(toPost);
}

export const WALL_PAGE_SIZE = 24;

/** One page of the whole wall (every visible post, newest first), for /notes. */
export async function wallPage(kind: PostKind | null, page: number): Promise<{ posts: Post[]; total: number }> {
  "use cache";
  cacheTag(RECENT_TAG);
  const from = (page - 1) * WALL_PAGE_SIZE;
  let query = supabasePublic().from("posts").select(COLUMNS, { count: "exact" });
  if (kind) query = query.eq("kind", kind);
  const { data, error, count } = await query.order("created_at", { ascending: false }).order("id").range(from, from + WALL_PAGE_SIZE - 1);
  if (error?.code === "PGRST103") {
    // asked for a page past the end
    let head = supabasePublic().from("posts").select("id", { count: "exact", head: true });
    if (kind) head = head.eq("kind", kind);
    const { count: total, error: e2 } = await head;
    if (e2) throw new Error(e2.message);
    return { posts: [], total: total ?? 0 };
  }
  if (error) throw new Error(error.message);
  return { posts: (data as unknown as Row[]).map(toPost), total: count ?? 0 };
}

export type CafeStats = { avg: number; reviews: number; notes: number };

/** Star average + post counts for a set of cafes (search cards, "also nearby").
 *  Tagged with every cafe's posts tag, so a new review refreshes it at once. */
export async function cafeStats(ids: string[]): Promise<Record<string, CafeStats>> {
  "use cache";
  const sorted = [...new Set(ids)].sort();
  if (!sorted.length) return {};
  cacheTag(...sorted.map(postsTag));
  const { data, error } = await supabasePublic().from("posts").select("cafe_id, kind, rating").in("cafe_id", sorted).limit(5000);
  if (error) throw new Error(error.message);
  const out: Record<string, CafeStats & { sum: number }> = {};
  for (const r of data as { cafe_id: string; kind: PostKind; rating: number | null }[]) {
    const s = (out[r.cafe_id] ??= { avg: 0, reviews: 0, notes: 0, sum: 0 });
    if (r.kind === "review" && r.rating) {
      s.reviews++;
      s.sum += r.rating;
    } else if (r.kind === "note") s.notes++;
  }
  return Object.fromEntries(Object.entries(out).map(([id, { sum, ...s }]) => [id, { ...s, avg: s.reviews ? sum / s.reviews : 0 }]));
}

/** Same as cafeStats, but never breaks a page if the database is unreachable. */
export async function cafeStatsSafe(ids: string[]): Promise<Record<string, CafeStats>> {
  try {
    return await cafeStats([...new Set(ids)].sort());
  } catch {
    return {};
  }
}
