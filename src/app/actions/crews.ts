"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { CREW_EMOJI, CREW_ID, CREW_LIMITS, INVITE_CODE, crewMembers, membership, newInviteCode } from "@/lib/crews";
import { isProfane } from "@/lib/moderation";
import { cafeById } from "@/lib/osm";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type CrewState = { error?: string; ok?: string; at?: number };

const CAFE_ID = /^(node|way|relation)-\d{1,15}$/;
const USERNAME = /^[a-z0-9_]{3,20}$/;
const SWEET = "Let's keep it sweet! Please reword that.";
const SPILLED = "Something spilled. Please try again.";
const NOT_MEMBER = "You're not in that crew.";

const db = () => supabaseAdmin();

function cleanName(raw: unknown): { name: string } | { error: string } {
  const name = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!name) return { error: "Give your crew a name!" };
  if (name.length > CREW_LIMITS.nameMax) return { error: `Keep the name under ${CREW_LIMITS.nameMax} characters.` };
  if (isProfane(name)) return { error: SWEET };
  return { name };
}

async function crewCount(userId: string) {
  const { count } = await db().from("crew_members").select("crew_id", { count: "exact", head: true }).eq("user_id", userId);
  return count ?? 0;
}

async function memberCount(crewId: string) {
  const { count } = await db().from("crew_members").select("user_id", { count: "exact", head: true }).eq("crew_id", crewId);
  return count ?? 0;
}

async function ownerOf(crewId: string, userId: string) {
  const me = await membership(crewId, userId);
  return me?.role === "owner" ? me : null;
}

/* ───────────── creating & managing ───────────── */

export async function createCrew(_: CrewState, form: FormData): Promise<CrewState> {
  const user = await requireProfile("/crews");
  const cleaned = cleanName(form.get("name"));
  if ("error" in cleaned) return { error: cleaned.error };
  const emoji = CREW_EMOJI.includes(String(form.get("emoji"))) ? String(form.get("emoji")) : "☕";
  if ((await crewCount(user.id)) >= CREW_LIMITS.crewsPerPerson) return { error: `You're in ${CREW_LIMITS.crewsPerPerson} crews already! Leave one to start another.` };

  const { data: crew, error } = await db().from("crews").insert({ name: cleaned.name, emoji, invite_code: newInviteCode() }).select("id").single();
  if (error || !crew) return { error: SPILLED };
  const { error: e2 } = await db().from("crew_members").insert({ crew_id: crew.id, user_id: user.id, role: "owner" });
  if (e2) {
    await db().from("crews").delete().eq("id", crew.id);
    return { error: SPILLED };
  }
  redirect(`/crews/${crew.id}`);
}

export async function renameCrew(_: CrewState, form: FormData): Promise<CrewState> {
  const user = await requireProfile("/crews");
  const crewId = String(form.get("crewId") ?? "");
  if (!(await ownerOf(crewId, user.id))) return { error: "Only the crew owner can rename it." };
  const cleaned = cleanName(form.get("name"));
  if ("error" in cleaned) return { error: cleaned.error };
  const emoji = CREW_EMOJI.includes(String(form.get("emoji"))) ? String(form.get("emoji")) : undefined;
  const { error } = await db().from("crews").update({ name: cleaned.name, ...(emoji && { emoji }) }).eq("id", crewId);
  if (error) return { error: SPILLED };
  refresh();
  return { ok: "Saved ✦", at: Date.now() };
}

export async function deleteCrew(crewId: string): Promise<CrewState> {
  const user = await requireProfile("/crews");
  if (!(await ownerOf(crewId, user.id))) return { error: "Only the crew owner can delete it." };
  const { error } = await db().from("crews").delete().eq("id", crewId);
  if (error) return { error: SPILLED };
  redirect("/crews");
}

export async function regenerateInvite(crewId: string): Promise<CrewState> {
  const user = await requireProfile("/crews");
  if (!(await ownerOf(crewId, user.id))) return { error: "Only the crew owner can make a new link." };
  const { error } = await db().from("crews").update({ invite_code: newInviteCode() }).eq("id", crewId);
  if (error) return { error: SPILLED };
  refresh();
  return { ok: "New link ready. The old one no longer works.", at: Date.now() };
}

export async function removeMember(crewId: string, memberId: string): Promise<CrewState> {
  const user = await requireProfile("/crews");
  if (!(await ownerOf(crewId, user.id))) return { error: "Only the crew owner can remove people." };
  if (memberId === user.id) return { error: "That's you! Use “leave crew” instead." };
  const { error } = await db().from("crew_members").delete().eq("crew_id", crewId).eq("user_id", memberId);
  if (error) return { error: SPILLED };
  refresh();
  return { ok: "Removed.", at: Date.now() };
}

export async function leaveCrew(crewId: string): Promise<CrewState> {
  const user = await requireProfile("/crews");
  const me = await membership(crewId, user.id);
  if (!me) return { error: NOT_MEMBER };
  const { error } = await db().from("crew_members").delete().eq("crew_id", crewId).eq("user_id", user.id);
  if (error) return { error: SPILLED };
  // last one out turns off the lights; otherwise crewMembers() hands ownership on
  const left = await crewMembers(crewId);
  if (!left.length) await db().from("crews").delete().eq("id", crewId);
  redirect("/crews");
}

/* ───────────── joining ───────────── */

export async function joinByCode(code: string): Promise<CrewState> {
  const user = await requireProfile(`/crews/join/${code}`);
  if (!INVITE_CODE.test(code)) return { error: "This invite link has expired." };
  const { data: crew } = await db().from("crews").select("id").eq("invite_code", code).maybeSingle();
  if (!crew) return { error: "This invite link has expired. Ask your friend for a fresh one!" };
  if (!(await membership(crew.id, user.id))) {
    if ((await memberCount(crew.id)) >= CREW_LIMITS.membersPerCrew) return { error: `This crew is full (${CREW_LIMITS.membersPerCrew} people).` };
    if ((await crewCount(user.id)) >= CREW_LIMITS.crewsPerPerson) return { error: `You're in ${CREW_LIMITS.crewsPerPerson} crews already! Leave one first.` };
    const { error } = await db().from("crew_members").insert({ crew_id: crew.id, user_id: user.id });
    if (error && error.code !== "23505") return { error: SPILLED };
    await db().from("crew_invites").delete().eq("crew_id", crew.id).eq("invitee_id", user.id);
  }
  redirect(`/crews/${crew.id}`);
}

export async function inviteByUsername(_: CrewState, form: FormData): Promise<CrewState> {
  const user = await requireProfile("/crews");
  const crewId = String(form.get("crewId") ?? "");
  if (!(await membership(crewId, user.id))) return { error: NOT_MEMBER };
  const username = String(form.get("username") ?? "").trim().replace(/^@/, "").toLowerCase();
  if (!USERNAME.test(username)) return { error: "That doesn't look like a username (3–20 letters, numbers or _)." };

  const { data: friend } = await db().from("profiles").select("id, username").eq("username", username).maybeSingle();
  if (!friend) return { error: `Couldn't find @${username}. Check the spelling?` };
  if (friend.id === user.id) return { error: "You're already in! Invite a friend instead." };
  if (await membership(crewId, friend.id)) return { error: `@${username} is already in this crew.` };

  const dayAgo = new Date(Date.now() - 86400_000).toISOString();
  const { count } = await db().from("crew_invites").select("crew_id", { count: "exact", head: true }).eq("inviter_id", user.id).gte("created_at", dayAgo);
  if ((count ?? 0) >= CREW_LIMITS.invitesPerDay) return { error: "That's a lot of invites today! Try again tomorrow, or share the invite link." };

  const { error } = await db().from("crew_invites").insert({ crew_id: crewId, invitee_id: friend.id, inviter_id: user.id });
  if (error?.code === "23505") return { error: `@${username} already has an invite waiting.` };
  if (error) return { error: SPILLED };
  refresh();
  return { ok: `Invite sent to @${username} ✉`, at: Date.now() };
}

export async function acceptInvite(crewId: string): Promise<CrewState> {
  const user = await requireProfile("/crews");
  if (!CREW_ID.test(crewId)) return { error: "Couldn't find that invite." };
  const { data: invite } = await db().from("crew_invites").select("crew_id").eq("crew_id", crewId).eq("invitee_id", user.id).maybeSingle();
  if (!invite) return { error: "That invite has gone. Ask your friend to send another!" };
  if ((await memberCount(crewId)) >= CREW_LIMITS.membersPerCrew) return { error: `This crew is full (${CREW_LIMITS.membersPerCrew} people).` };
  if ((await crewCount(user.id)) >= CREW_LIMITS.crewsPerPerson) return { error: `You're in ${CREW_LIMITS.crewsPerPerson} crews already! Leave one first.` };
  const { error } = await db().from("crew_members").insert({ crew_id: crewId, user_id: user.id });
  if (error && error.code !== "23505") return { error: SPILLED };
  await db().from("crew_invites").delete().eq("crew_id", crewId).eq("invitee_id", user.id);
  redirect(`/crews/${crewId}`);
}

export async function declineInvite(crewId: string): Promise<CrewState> {
  const user = await requireProfile("/crews");
  if (!CREW_ID.test(crewId)) return { error: "Couldn't find that invite." };
  await db().from("crew_invites").delete().eq("crew_id", crewId).eq("invitee_id", user.id);
  refresh();
  return { ok: "Declined.", at: Date.now() };
}

/** Take back an invite you (or anyone in the crew) sent. */
export async function cancelInvite(crewId: string, inviteeId: string): Promise<CrewState> {
  const user = await requireProfile("/crews");
  if (!(await membership(crewId, user.id))) return { error: NOT_MEMBER };
  await db().from("crew_invites").delete().eq("crew_id", crewId).eq("invitee_id", inviteeId);
  refresh();
  return { ok: "Invite cancelled.", at: Date.now() };
}

/* ───────────── the shared list ───────────── */

export async function addCafeToCrew(crewId: string, cafeId: string, rawNote: string): Promise<CrewState> {
  const user = await requireProfile(`/cafe/${cafeId}`);
  if (!CAFE_ID.test(cafeId)) return { error: "That cafe doesn't look right." };
  if (!(await membership(crewId, user.id))) return { error: NOT_MEMBER };
  const note = String(rawNote ?? "").trim().replace(/\s+/g, " ");
  if (note.length > CREW_LIMITS.noteMax) return { error: `Keep the note under ${CREW_LIMITS.noteMax} characters.` };
  if (note && isProfane(note)) return { error: SWEET };

  const { count } = await db().from("crew_cafes").select("cafe_id", { count: "exact", head: true }).eq("crew_id", crewId);
  if ((count ?? 0) >= CREW_LIMITS.cafesPerCrew) return { error: `This crew's list is full (${CREW_LIMITS.cafesPerCrew} cafes).` };

  // the snapshot comes from OpenStreetMap (cached), never from the browser
  const cafe = await cafeById(cafeId).catch(() => null);
  if (!cafe) return { error: "Couldn't find this cafe on the map right now. Try again in a moment." };
  const place = [cafe.neighbourhood, cafe.city].filter(Boolean).join(", ") || cafe.country || null;
  const { error } = await db().from("crew_cafes").insert({
    crew_id: crewId,
    cafe_id: cafeId,
    name: cafe.name.slice(0, 200),
    place: place?.slice(0, 200) ?? null,
    accent: cafe.accent,
    added_by: user.id,
    note: note || null,
  });
  if (error?.code === "23505") return { error: "It's already on this crew's list!" };
  if (error) return { error: SPILLED };
  return { ok: "Added ✦", at: Date.now() };
}

export async function removeCrewCafe(crewId: string, cafeId: string): Promise<CrewState> {
  const user = await requireProfile("/crews");
  const me = await membership(crewId, user.id);
  if (!me) return { error: NOT_MEMBER };
  const { data: row } = await db().from("crew_cafes").select("added_by").eq("crew_id", crewId).eq("cafe_id", cafeId).maybeSingle();
  if (!row) return { error: "It's already gone." };
  if (row.added_by !== user.id && me.role !== "owner") return { error: "Only the person who added it (or the crew owner) can remove it." };
  const { error } = await db().from("crew_cafes").delete().eq("crew_id", crewId).eq("cafe_id", cafeId);
  if (error) return { error: SPILLED };
  refresh();
  return { ok: "Removed.", at: Date.now() };
}

export async function setCrewHeart(crewId: string, cafeId: string, on: boolean): Promise<CrewState & { hearted?: boolean }> {
  const user = await requireProfile("/crews");
  if (!CAFE_ID.test(cafeId) || !(await membership(crewId, user.id))) return { error: NOT_MEMBER };
  const t = db().from("crew_cafe_hearts");
  const { error } = on
    ? await t.upsert({ crew_id: crewId, cafe_id: cafeId, user_id: user.id }, { onConflict: "crew_id,cafe_id,user_id", ignoreDuplicates: true })
    : await t.delete().eq("crew_id", crewId).eq("cafe_id", cafeId).eq("user_id", user.id);
  if (error) return { error: SPILLED, hearted: !on };
  return { hearted: on };
}
