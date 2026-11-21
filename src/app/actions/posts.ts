"use server";

import { updateTag } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { isProfane, LIMITS, rateLimitReason } from "@/lib/moderation";
import { cafeById } from "@/lib/osm";
import { DRINKS } from "@/lib/drinks";
import { isDrinkId, postsTag, RECENT_TAG, userTag, type PostKind } from "@/lib/posts";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PHOTO_BUCKET } from "@/lib/supabase/public";
import { VIBES } from "@/lib/vibes";

export type FormState = { error?: string; ok?: boolean; at?: number; kind?: PostKind };

const CAFE_ID = /^(node|way|relation)-\d{1,15}$/;
const UUID = /^[0-9a-f-]{36}$/;
const PHOTO_PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg)$/;
const SWEET = "Let's keep it sweet! Please reword that without the strong language.";
const SPILLED = "Something spilled. Please try again.";
const BAD_PHOTO = "One of the photos didn't upload properly.";

/** Signed upload slots so the browser can send photos straight to storage. */
export async function getUploadUrls(types: string[]): Promise<{ path: string; token: string }[] | { error: string }> {
  const user = await requireProfile();
  if (!Array.isArray(types) || types.length < 1 || types.length > LIMITS.photos) return { error: "Up to 3 photos per review." };
  const storage = supabaseAdmin().storage.from(PHOTO_BUCKET);
  const slots: { path: string; token: string }[] = [];
  for (const type of types) {
    const path = `${user.id}/${crypto.randomUUID()}.${type === "image/jpeg" ? "jpg" : "webp"}`;
    const { data, error } = await storage.createSignedUploadUrl(path);
    if (error || !data) return { error: "Couldn't get the photo upload ready. Try again?" };
    slots.push({ path, token: data.token });
  }
  return slots;
}

type Parsed = { kind: PostKind; cafeId: string; rating: number | null; drink: string | null; vibes: string[]; body: string; photos: string[] };

/** Validate everything that came from the browser. */
function parse(form: FormData, userId: string): { error: string } | Parsed {
  const kind = form.get("kind");
  if (kind !== "review" && kind !== "note") return { error: "Pick review or love note." };
  const cafeId = String(form.get("cafeId") ?? "");
  if (!CAFE_ID.test(cafeId)) return { error: "That cafe doesn't look right." };

  const body = String(form.get("body") ?? "").trim().replace(/\r\n/g, "\n");
  const max = kind === "review" ? LIMITS.reviewMax : LIMITS.noteMax;
  if (!body) return { error: kind === "review" ? "Write a few words about your visit." : "Your love note is empty!" };
  if (body.length > max) return { error: `That's a bit long. Keep it under ${max} characters.` };
  if (isProfane(body)) return { error: SWEET };

  if (kind === "note") return { kind, cafeId, rating: null, drink: null, vibes: [], body, photos: [] };

  const rating = Number(form.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Tap the stars to give a rating." };

  const rawDrink = String(form.get("drink") ?? "").trim().slice(0, 60);
  // "Iced latte" typed or picked from the list → the "iced-latte" id
  const named = Object.entries(DRINKS).find(([, d]) => d.name.toLowerCase() === rawDrink.toLowerCase())?.[0];
  const drink = rawDrink ? (isDrinkId(rawDrink) ? rawDrink : (named ?? rawDrink.toLowerCase())) : null;
  if (drink && isProfane(drink)) return { error: SWEET };

  const vibes = [...new Set(form.getAll("vibes").map(String))].filter((v) => v in VIBES).slice(0, 6);

  const photos = [...new Set(form.getAll("photos").map(String))].filter(Boolean);
  if (photos.length > LIMITS.photos) return { error: "Up to 3 photos per review." };
  if (photos.some((p) => !PHOTO_PATH.test(p) || !p.startsWith(`${userId}/`))) return { error: BAD_PHOTO };

  return { kind, cafeId, rating, drink, vibes, body, photos };
}

/** True if every path was really uploaded by this user. */
async function photosExist(userId: string, paths: string[]) {
  if (!paths.length) return true;
  const { data } = await supabaseAdmin().storage.from(PHOTO_BUCKET).list(userId, { limit: 1000 });
  const have = new Set((data ?? []).map((f) => `${userId}/${f.name}`));
  return paths.every((p) => have.has(p));
}

async function removePhotos(paths: string[]) {
  if (paths.length) await supabaseAdmin().storage.from(PHOTO_BUCKET).remove(paths);
}

export async function createPost(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireProfile(`/cafe/${String(form.get("cafeId") ?? "")}`);
  const input = parse(form, user.id);
  if ("error" in input) return { error: input.error };

  const limited = await rateLimitReason(user.id, input.cafeId, input.kind);
  if (limited) return { error: limited };
  if (!(await photosExist(user.id, input.photos))) return { error: BAD_PHOTO };

  // the cafe name comes from OpenStreetMap, never from the browser
  const cafe = await cafeById(input.cafeId).catch(() => null);
  if (!cafe) return { error: "Couldn't find this cafe on the map right now. Try again in a moment." };

  const { error } = await supabaseAdmin().from("posts").insert({
    user_id: user.id,
    cafe_id: input.cafeId,
    cafe_name: cafe.name.slice(0, 200),
    kind: input.kind,
    rating: input.rating,
    drink: input.drink,
    vibes: input.vibes,
    body: input.body,
    photos: input.photos,
  });
  if (error) {
    if (error.code === "23505") return { error: "You've already reviewed this cafe. Edit your review instead!" };
    return { error: SPILLED };
  }
  updateTag(postsTag(input.cafeId));
  updateTag(RECENT_TAG);
  updateTag(userTag(user.profile.username));
  return { ok: true, at: Date.now(), kind: input.kind };
}

type OwnedPost = { id: string; user_id: string; cafe_id: string; kind: PostKind; photos: string[]; author: { username: string } };

/** Fetch a post and make sure the caller may change it. */
async function ownedPost(id: string, userId: string, isAdmin = false): Promise<OwnedPost | null> {
  if (!UUID.test(id)) return null;
  const { data } = await supabaseAdmin()
    .from("posts")
    .select("id, user_id, cafe_id, kind, photos, author:profiles!inner(username)")
    .eq("id", id)
    .maybeSingle();
  const post = data as unknown as OwnedPost | null;
  if (!post || (post.user_id !== userId && !isAdmin)) return null;
  return post;
}

export async function updatePost(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireProfile();
  const post = await ownedPost(String(form.get("id") ?? ""), user.id);
  if (!post) return { error: "You can only edit your own posts." };
  form.set("kind", post.kind);
  form.set("cafeId", post.cafe_id);
  const input = parse(form, user.id);
  if ("error" in input) return { error: input.error };

  const added = input.photos.filter((p) => !post.photos.includes(p));
  if (!(await photosExist(user.id, added))) return { error: BAD_PHOTO };

  const { error } = await supabaseAdmin()
    .from("posts")
    .update({ rating: input.rating, drink: input.drink, vibes: input.vibes, body: input.body, photos: input.photos })
    .eq("id", post.id)
    .eq("user_id", user.id);
  if (error) return { error: SPILLED };

  await removePhotos(post.photos.filter((p) => !input.photos.includes(p)));
  updateTag(postsTag(post.cafe_id));
  updateTag(RECENT_TAG);
  updateTag(userTag(user.profile.username));
  return { ok: true, at: Date.now() };
}

export async function deletePost(id: string): Promise<FormState> {
  const user = await requireProfile();
  const post = await ownedPost(id, user.id, user.profile.isAdmin);
  if (!post) return { error: "You can only delete your own posts." };
  const { error } = await supabaseAdmin().from("posts").delete().eq("id", post.id);
  if (error) return { error: "Couldn't delete it. Please try again." };
  await removePhotos(post.photos);
  updateTag(postsTag(post.cafe_id));
  updateTag(RECENT_TAG);
  updateTag(userTag(post.author.username));
  return { ok: true };
}

export async function reportPost(id: string, reason: string): Promise<FormState> {
  const user = await requireProfile();
  if (!UUID.test(id)) return { error: "Couldn't find that post." };
  const db = supabaseAdmin();
  const { data: post } = await db.from("posts").select("user_id, cafe_id").eq("id", id).maybeSingle();
  if (!post) return { error: "Couldn't find that post." };
  if (post.user_id === user.id) return { error: "That's your own post. You can edit or delete it instead." };
  const { error } = await db.from("reports").insert({ post_id: id, reporter_id: user.id, reason: String(reason ?? "").trim().slice(0, 300) || null });
  if (error?.code === "23505") return { ok: true }; // already reported: same outcome
  if (error) return { error: "Couldn't send the report. Please try again." };
  updateTag(postsTag(post.cafe_id));
  updateTag(RECENT_TAG);
  return { ok: true };
}
