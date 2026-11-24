import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { supabaseAdmin } from "./supabase/admin";
import type { Cafe } from "./types";

/**
 * Cafe lists: "best study spots in Toronto", each cafe with what to order.
 * Private unless the owner makes them public. Every read runs with the
 * service role, so each one checks the viewer owns the list or it's public.
 */

export { LIST_EMOJI, LIST_LIMITS } from "./list-constants";
export const LIST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Public lists by this person (profile page). */
export const userListsTag = (userId: string) => `lists:user:${userId}`;
/** Public recommendations of this cafe (cafe page). */
export const cafeListsTag = (cafeId: string) => `lists:cafe:${cafeId}`;
/** One public list. */
export const listTag = (listId: string) => `list:${listId}`;

export type ListSummary = { id: string; title: string; emoji: string; isPublic: boolean; cafeCount: number; updatedAt: string };
export type ListItem = {
  cafeId: string;
  name: string;
  place: string | null;
  accent: Cafe["accent"];
  recommend: string | null;
  note: string | null;
  createdAt: string;
};
export type CafeList = {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  isPublic: boolean;
  owner: { id: string; username: string; avatar: string };
  items: ListItem[];
  updatedAt: string;
};
export type Recommendation = { listId: string; listTitle: string; listEmoji: string; username: string; avatar: string; recommend: string | null; note: string | null };

type SummaryRow = { id: string; title: string; emoji: string; is_public: boolean; updated_at: string; items: { count: number }[] };
const toSummary = (r: SummaryRow): ListSummary => ({
  id: r.id,
  title: r.title,
  emoji: r.emoji,
  isPublic: r.is_public,
  cafeCount: r.items?.[0]?.count ?? 0,
  updatedAt: r.updated_at,
});
const SUMMARY_COLS = "id, title, emoji, is_public, updated_at, items:cafe_list_items(count)";

/** All of someone's lists, private ones included. Only call for the owner themselves. */
export async function myLists(userId: string): Promise<ListSummary[]> {
  const { data, error } = await supabaseAdmin().from("cafe_lists").select(SUMMARY_COLS).eq("user_id", userId).order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as SummaryRow[]).map(toSummary);
}

/** Someone's public lists, for their profile. Cached until they change one. */
export async function publicListsOf(userId: string): Promise<ListSummary[]> {
  "use cache";
  cacheTag(userListsTag(userId));
  cacheLife("days");
  const { data, error } = await supabaseAdmin()
    .from("cafe_lists")
    .select(SUMMARY_COLS)
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as SummaryRow[]).map(toSummary);
}

type ListRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  emoji: string;
  is_public: boolean;
  updated_at: string;
  owner: { id: string; username: string; avatar: string };
  items: { cafe_id: string; name: string; place: string | null; accent: Cafe["accent"]; recommend: string | null; note: string | null; created_at: string }[];
};

async function loadList(id: string): Promise<CafeList | null> {
  const { data, error } = await supabaseAdmin()
    .from("cafe_lists")
    .select("id, user_id, title, description, emoji, is_public, updated_at, owner:profiles!inner(id, username, avatar), items:cafe_list_items(cafe_id, name, place, accent, recommend, note, created_at)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as unknown as ListRow;
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    emoji: r.emoji,
    isPublic: r.is_public,
    owner: r.owner,
    updatedAt: r.updated_at,
    items: r.items
      .map((i) => ({ cafeId: i.cafe_id, name: i.name, place: i.place, accent: i.accent, recommend: i.recommend, note: i.note, createdAt: i.created_at }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

/** A public list, cached until its owner edits it (null if it's private or gone). */
async function publicList(id: string): Promise<CafeList | null> {
  "use cache";
  cacheTag(listTag(id));
  cacheLife("days");
  const list = await loadList(id);
  return list?.isPublic ? list : null;
}

/** A list as this viewer may see it: public, or theirs. Otherwise null (shown as a 404). */
export async function listForViewer(id: string, viewerId: string | undefined): Promise<CafeList | null> {
  if (!LIST_ID.test(id)) return null;
  const pub = await publicList(id);
  if (pub) return pub;
  if (!viewerId) return null;
  const list = await loadList(id);
  return list && list.owner.id === viewerId ? list : null;
}

/** For the "add to a list" dialog: your lists, and which already have this cafe. */
export async function myListsWithCafe(userId: string, cafeId: string): Promise<(ListSummary & { has: boolean })[]> {
  const [lists, { data, error }] = await Promise.all([
    myLists(userId),
    supabaseAdmin().from("cafe_list_items").select("list_id, list:cafe_lists!inner(user_id)").eq("cafe_id", cafeId).eq("list.user_id", userId),
  ]);
  if (error) throw error;
  const has = new Set((data ?? []).map((r) => r.list_id as string));
  return lists.map((l) => ({ ...l, has: has.has(l.id) }));
}

/** What people recommend at this cafe, from public lists. Cached until a list with it changes. */
export async function recommendationsFor(cafeId: string): Promise<Recommendation[]> {
  "use cache";
  cacheTag(cafeListsTag(cafeId));
  cacheLife("days");
  const { data, error } = await supabaseAdmin()
    .from("cafe_list_items")
    .select("list_id, recommend, note, list:cafe_lists!inner(title, emoji, is_public, owner:profiles!inner(username, avatar))")
    .eq("cafe_id", cafeId)
    .eq("list.is_public", true)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  type Row = { list_id: string; recommend: string | null; note: string | null; list: { title: string; emoji: string; owner: { username: string; avatar: string } } };
  return (data as unknown as Row[]).map((r) => ({
    listId: r.list_id,
    listTitle: r.list.title,
    listEmoji: r.list.emoji,
    username: r.list.owner.username,
    avatar: r.list.owner.avatar,
    recommend: r.recommend,
    note: r.note,
  }));
}
