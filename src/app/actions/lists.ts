"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { cafeById, CAFE_ID } from "@/lib/cafes";
import { cafeListsTag, LIST_EMOJI, LIST_ID, LIST_LIMITS, listTag, userListsTag } from "@/lib/lists";
import { isProfane } from "@/lib/moderation";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type ListState = { error?: string; ok?: string; at?: number };

const SWEET = "Let's keep it sweet! Please reword that.";
const SPILLED = "Something spilled. Please try again.";
const NOT_YOURS = "Couldn't find that list.";
const clean = (v: unknown) => String(v ?? "").trim().replace(/\s+/g, " ");
const db = () => supabaseAdmin();

/** The list, if it's this person's. */
async function ownList(listId: string, userId: string) {
  if (!LIST_ID.test(listId)) return null;
  const { data } = await db().from("cafe_lists").select("id, user_id, is_public").eq("id", listId).maybeSingle();
  return data && data.user_id === userId ? data : null;
}

/** Refresh every cached view a list shows up in. */
async function refresh(listId: string, userId: string, cafeIds?: string[]) {
  updateTag(listTag(listId));
  updateTag(userListsTag(userId));
  let ids = cafeIds;
  if (!ids) {
    const { data } = await db().from("cafe_list_items").select("cafe_id").eq("list_id", listId);
    ids = (data ?? []).map((r) => r.cafe_id as string);
  }
  for (const id of ids) updateTag(cafeListsTag(id));
}

function parseDetails(form: FormData): { title: string; description: string | null; emoji: string; isPublic: boolean } | { error: string } {
  const title = clean(form.get("title"));
  if (!title) return { error: "Give your list a name." };
  if (title.length > LIST_LIMITS.titleMax) return { error: `Keep the name under ${LIST_LIMITS.titleMax} characters.` };
  const description = String(form.get("description") ?? "").trim().replace(/\r\n/g, "\n") || null;
  if (description && description.length > LIST_LIMITS.descriptionMax) return { error: `Keep the description under ${LIST_LIMITS.descriptionMax} characters.` };
  if (isProfane(title) || (description && isProfane(description))) return { error: SWEET };
  const emoji = String(form.get("emoji") ?? "☕");
  return { title, description, emoji: LIST_EMOJI.includes(emoji) ? emoji : "☕", isPublic: form.get("isPublic") === "on" || form.get("isPublic") === "true" };
}

export async function createList(_: ListState, form: FormData): Promise<ListState> {
  const user = await requireProfile("/lists");
  const at = Date.now();
  const details = parseDetails(form);
  if ("error" in details) return { error: details.error, at };
  const { count } = await db().from("cafe_lists").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if ((count ?? 0) >= LIST_LIMITS.listsPerPerson) return { error: `You have ${LIST_LIMITS.listsPerPerson} lists already. Delete one to make room.`, at };

  const { data, error } = await db()
    .from("cafe_lists")
    .insert({ user_id: user.id, title: details.title, description: details.description, emoji: details.emoji, is_public: details.isPublic })
    .select("id")
    .single();
  if (error || !data) return { error: SPILLED, at };
  updateTag(userListsTag(user.id));

  // made from a cafe page's "add to a list": put that cafe straight in
  const cafeId = String(form.get("cafeId") ?? "");
  if (CAFE_ID.test(cafeId)) {
    const added = await addCafeToList(data.id, cafeId, String(form.get("recommend") ?? ""), String(form.get("note") ?? ""));
    if (added.error) return { error: added.error, at };
    return { ok: data.id, at };
  }
  redirect(`/lists/${data.id}`);
}

export async function updateList(listId: string, _: ListState, form: FormData): Promise<ListState> {
  const user = await requireProfile(`/lists/${listId}`);
  const at = Date.now();
  if (!(await ownList(listId, user.id))) return { error: NOT_YOURS, at };
  const details = parseDetails(form);
  if ("error" in details) return { error: details.error, at };
  const { error } = await db()
    .from("cafe_lists")
    .update({ title: details.title, description: details.description, emoji: details.emoji, is_public: details.isPublic, updated_at: new Date().toISOString() })
    .eq("id", listId);
  if (error) return { error: SPILLED, at };
  await refresh(listId, user.id);
  return { ok: details.isPublic ? "Saved. Anyone with the link can see it ✦" : "Saved. Only you can see it 🔒", at };
}

export async function deleteList(listId: string): Promise<ListState> {
  const user = await requireProfile(`/lists/${listId}`);
  if (!(await ownList(listId, user.id))) return { error: NOT_YOURS };
  const { data: items } = await db().from("cafe_list_items").select("cafe_id").eq("list_id", listId);
  const { error } = await db().from("cafe_lists").delete().eq("id", listId);
  if (error) return { error: SPILLED };
  await refresh(listId, user.id, (items ?? []).map((r) => r.cafe_id as string));
  redirect("/lists");
}

/** Add a cafe (with what to order) to one of your lists. */
export async function addCafeToList(listId: string, cafeId: string, rawRecommend: string, rawNote: string): Promise<ListState> {
  const user = await requireProfile(`/cafe/${cafeId}`);
  if (!CAFE_ID.test(cafeId)) return { error: "That cafe doesn't look right." };
  if (!(await ownList(listId, user.id))) return { error: NOT_YOURS };
  const recommend = clean(rawRecommend) || null;
  const note = String(rawNote ?? "").trim() || null;
  if (recommend && recommend.length > LIST_LIMITS.recommendMax) return { error: `Keep "what to order" under ${LIST_LIMITS.recommendMax} characters.` };
  if (note && note.length > LIST_LIMITS.noteMax) return { error: `Keep the note under ${LIST_LIMITS.noteMax} characters.` };
  if ((recommend && isProfane(recommend)) || (note && isProfane(note))) return { error: SWEET };

  const { count } = await db().from("cafe_list_items").select("cafe_id", { count: "exact", head: true }).eq("list_id", listId);
  if ((count ?? 0) >= LIST_LIMITS.cafesPerList) return { error: `This list is full (${LIST_LIMITS.cafesPerList} cafes).` };

  // the snapshot comes from the map (cached), never from the browser
  const cafe = await cafeById(cafeId).catch(() => null);
  if (!cafe) return { error: "Couldn't find this cafe on the map right now. Try again in a moment." };
  const place = [cafe.neighbourhood, cafe.city].filter(Boolean).join(", ") || cafe.country || null;
  const { error } = await db().from("cafe_list_items").insert({
    list_id: listId,
    cafe_id: cafeId,
    name: cafe.name.slice(0, 200),
    place: place?.slice(0, 200) ?? null,
    accent: cafe.accent,
    recommend,
    note,
  });
  if (error?.code === "23505") return { error: "It's already on that list!" };
  if (error) return { error: SPILLED };
  await db().from("cafe_lists").update({ updated_at: new Date().toISOString() }).eq("id", listId);
  await refresh(listId, user.id, [cafeId]);
  return { ok: "Added ✦", at: Date.now() };
}

export async function updateListItem(listId: string, cafeId: string, rawRecommend: string, rawNote: string): Promise<ListState> {
  const user = await requireProfile(`/lists/${listId}`);
  if (!CAFE_ID.test(cafeId) || !(await ownList(listId, user.id))) return { error: NOT_YOURS };
  const recommend = clean(rawRecommend) || null;
  const note = String(rawNote ?? "").trim() || null;
  if (recommend && recommend.length > LIST_LIMITS.recommendMax) return { error: `Keep "what to order" under ${LIST_LIMITS.recommendMax} characters.` };
  if (note && note.length > LIST_LIMITS.noteMax) return { error: `Keep the note under ${LIST_LIMITS.noteMax} characters.` };
  if ((recommend && isProfane(recommend)) || (note && isProfane(note))) return { error: SWEET };
  const { error } = await db().from("cafe_list_items").update({ recommend, note }).eq("list_id", listId).eq("cafe_id", cafeId);
  if (error) return { error: SPILLED };
  await refresh(listId, user.id, [cafeId]);
  return { ok: "Saved ✦", at: Date.now() };
}

export async function removeFromList(listId: string, cafeId: string): Promise<ListState> {
  const user = await requireProfile(`/lists/${listId}`);
  if (!CAFE_ID.test(cafeId) || !(await ownList(listId, user.id))) return { error: NOT_YOURS };
  const { error } = await db().from("cafe_list_items").delete().eq("list_id", listId).eq("cafe_id", cafeId);
  if (error) return { error: SPILLED };
  await refresh(listId, user.id, [cafeId]);
  return { ok: "Removed." };
}
