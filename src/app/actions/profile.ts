"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile, requireUser, safeNext } from "@/lib/auth";
import { isProfane } from "@/lib/moderation";
import { isDrinkId, postsTag, RECENT_TAG, userTag } from "@/lib/posts";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PHOTO_BUCKET } from "@/lib/supabase/public";
import { supabaseServer } from "@/lib/supabase/server";
import type { FormState } from "./posts";

const RESERVED = new Set(["admin", "administrator", "latteletters", "latteletter", "moderator", "mod", "support", "official", "staff", "team"]);

/** Every cafe wall this person appears on (their name and avatar show there). */
async function wallsOf(userId: string) {
  const { data } = await supabaseAdmin().from("posts").select("cafe_id").eq("user_id", userId);
  return [...new Set((data ?? []).map((r) => r.cafe_id as string))];
}

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const avatar = String(form.get("avatar") ?? "");
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return { error: "Usernames are 3–20 letters, numbers or underscores." };
  if (RESERVED.has(username) && !user.profile?.isAdmin) return { error: "That username is reserved. Try another!" };
  if (isProfane(username.replace(/_/g, " "))) return { error: "Let's keep usernames sweet. Try another!" };
  if (!isDrinkId(avatar)) return { error: "Pick a cup for your avatar." };

  const old = user.profile?.username;
  const { error } = await supabaseAdmin().from("profiles").upsert({ id: user.id, username, avatar }, { onConflict: "id" });
  if (error) {
    if (error.code === "23505") return { error: "Someone already has that username. Try another!" };
    return { error: "Something spilled. Please try again." };
  }
  updateTag(userTag(username));
  if (old && old !== username) updateTag(userTag(old));
  for (const cafe of await wallsOf(user.id)) updateTag(postsTag(cafe));
  updateTag(RECENT_TAG);

  const next = form.get("next");
  if (next !== null) redirect(safeNext(next));
  return { ok: true, at: Date.now() };
}

/** PIPEDA: remove the account, every post and every photo. */
export async function deleteAccount(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireProfile("/settings");
  if (String(form.get("confirm") ?? "").trim().toLowerCase() !== user.profile.username) {
    return { error: `Type your username (${user.profile.username}) to confirm.` };
  }
  const db = supabaseAdmin();
  const walls = await wallsOf(user.id);

  const storage = db.storage.from(PHOTO_BUCKET);
  const { data: files } = await storage.list(user.id, { limit: 1000 });
  if (files?.length) await storage.remove(files.map((f) => `${user.id}/${f.name}`));

  // cascades: auth user → profile → posts → reports
  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) return { error: "Couldn't delete your account. Please email us and we'll do it by hand." };

  await (await supabaseServer()).auth.signOut().catch(() => {});
  for (const cafe of walls) updateTag(postsTag(cafe));
  updateTag(RECENT_TAG);
  updateTag(userTag(user.profile.username));
  redirect("/?bye=1");
}
