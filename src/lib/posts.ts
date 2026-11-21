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
  createdAt: string;
  edited: boolean;
  author: { id: string; username: string; avatar: string };
};

export const postsTag = (cafeId: string) => `posts:${cafeId}`;
export const userTag = (username: string) => `user:${username}`;

const COLUMNS = "id, kind, cafe_id, cafe_name, rating, drink, vibes, body, photos, created_at, updated_at, author:profiles!inner(id, username, avatar)";

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
