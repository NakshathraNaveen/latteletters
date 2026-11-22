import "server-only";
import type { Cafe } from "./types";
import { supabaseAdmin } from "./supabase/admin";

/**
 * Cafe crews: private friend groups with a shared cafe list.
 * Everything here runs with the service role, so every read that returns
 * crew content goes through a membership check first.
 */

export const CREW_LIMITS = { crewsPerPerson: 20, membersPerCrew: 30, cafesPerCrew: 300, invitesPerDay: 20, noteMax: 140, nameMax: 40 };
export const CREW_EMOJI = ["☕", "🧋", "🍵", "🥐", "🍰", "🧁", "🍩", "📚", "🌙", "🌿", "💌", "✨"];
export const CREW_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const INVITE_CODE = /^[A-Za-z0-9_-]{12}$/;

export type CrewMember = { id: string; username: string; avatar: string; role: "owner" | "member" };
export type CrewSummary = { id: string; name: string; emoji: string; members: CrewMember[]; cafeCount: number };
export type CrewCafe = {
  cafeId: string;
  name: string;
  place: string | null;
  accent: Cafe["accent"];
  note: string | null;
  addedBy: { id: string; username: string } | null;
  createdAt: string;
  hearts: number;
  heartedByMe: boolean;
};
export type Crew = {
  id: string;
  name: string;
  emoji: string;
  inviteCode: string;
  members: CrewMember[];
  me: CrewMember;
  cafes: CrewCafe[];
  pending: { id: string; username: string }[];
};
export type CrewInvite = { crewId: string; name: string; emoji: string; from: string; memberCount: number };

type MemberRow = { user_id: string; role: "owner" | "member"; joined_at: string; profile: { username: string; avatar: string } };
const MEMBER_COLS = "user_id, role, joined_at, profile:profiles!inner(username, avatar)";
const toMember = (r: MemberRow): CrewMember => ({ id: r.user_id, username: r.profile.username, avatar: r.profile.avatar, role: r.role });

/** Make sure a crew has an owner: if the owner left or deleted their account, the longest-standing member takes over. */
async function ensureOwner(crewId: string, rows: MemberRow[]) {
  if (!rows.length || rows.some((r) => r.role === "owner")) return rows;
  const next = [...rows].sort((a, b) => a.joined_at.localeCompare(b.joined_at))[0];
  await supabaseAdmin().from("crew_members").update({ role: "owner" }).eq("crew_id", crewId).eq("user_id", next.user_id);
  return rows.map((r) => (r === next ? { ...r, role: "owner" as const } : r));
}

/** Members of a crew, owner first, then by when they joined. */
export async function crewMembers(crewId: string): Promise<CrewMember[]> {
  const { data, error } = await supabaseAdmin().from("crew_members").select(MEMBER_COLS).eq("crew_id", crewId).order("joined_at");
  if (error) throw error;
  const rows = await ensureOwner(crewId, data as unknown as MemberRow[]);
  return rows.map(toMember).sort((a, b) => Number(b.role === "owner") - Number(a.role === "owner"));
}

/** Is this person in the crew? Returns their membership, or null. */
export async function membership(crewId: string, userId: string): Promise<CrewMember | null> {
  if (!CREW_ID.test(crewId)) return null;
  const members = await crewMembers(crewId);
  return members.find((m) => m.id === userId) ?? null;
}

/** The crews someone belongs to (for /crews and the add-to-crew picker). */
export async function myCrews(userId: string): Promise<CrewSummary[]> {
  const db = supabaseAdmin();
  const { data: mine, error } = await db.from("crew_members").select("crew_id, joined_at").eq("user_id", userId).order("joined_at", { ascending: false });
  if (error) throw error;
  const ids = (mine ?? []).map((r) => r.crew_id as string);
  if (!ids.length) return [];
  const [{ data: crews }, { data: members }, { data: cafes }] = await Promise.all([
    db.from("crews").select("id, name, emoji").in("id", ids),
    db.from("crew_members").select(`crew_id, ${MEMBER_COLS}`).in("crew_id", ids).order("joined_at"),
    db.from("crew_cafes").select("crew_id").in("crew_id", ids),
  ]);
  return ids
    .map((id) => {
      const c = crews?.find((x) => x.id === id);
      if (!c) return null;
      const rows = ((members ?? []) as unknown as (MemberRow & { crew_id: string })[]).filter((m) => m.crew_id === id);
      return {
        id,
        name: c.name as string,
        emoji: c.emoji as string,
        members: rows.map(toMember),
        cafeCount: (cafes ?? []).filter((x) => x.crew_id === id).length,
      };
    })
    .filter((c): c is CrewSummary => c !== null);
}

/** Username invites waiting for this person. */
export async function pendingInvites(userId: string): Promise<CrewInvite[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("crew_invites")
    .select("crew_id, created_at, crew:crews!inner(name, emoji), inviter:profiles!crew_invites_inviter_id_fkey(username)")
    .eq("invitee_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data as unknown as { crew_id: string; crew: { name: string; emoji: string }; inviter: { username: string } | null }[];
  if (!rows.length) return [];
  const { data: counts } = await db.from("crew_members").select("crew_id").in("crew_id", rows.map((r) => r.crew_id));
  return rows.map((r) => ({
    crewId: r.crew_id,
    name: r.crew.name,
    emoji: r.crew.emoji,
    from: r.inviter?.username ?? "a friend",
    memberCount: (counts ?? []).filter((c) => c.crew_id === r.crew_id).length,
  }));
}

export async function pendingInviteCount(userId: string): Promise<number> {
  const { count } = await supabaseAdmin().from("crew_invites").select("crew_id", { count: "exact", head: true }).eq("invitee_id", userId);
  return count ?? 0;
}

/** A whole crew, but only for its members (null otherwise, so pages can 404). */
export async function crewForMember(crewId: string, userId: string): Promise<Crew | null> {
  if (!CREW_ID.test(crewId)) return null;
  const db = supabaseAdmin();
  const members = await crewMembers(crewId);
  const me = members.find((m) => m.id === userId);
  if (!me) return null;

  const [{ data: crew, error: e1 }, { data: cafes, error: e2 }, { data: hearts, error: e3 }, { data: pending, error: e4 }] = await Promise.all([
    db.from("crews").select("id, name, emoji, invite_code").eq("id", crewId).maybeSingle(),
    db
      .from("crew_cafes")
      .select("cafe_id, name, place, accent, note, created_at, adder:profiles!crew_cafes_added_by_fkey(id, username)")
      .eq("crew_id", crewId)
      .order("created_at", { ascending: false }),
    db.from("crew_cafe_hearts").select("cafe_id, user_id").eq("crew_id", crewId),
    db.from("crew_invites").select("invitee:profiles!crew_invites_invitee_id_fkey(id, username)").eq("crew_id", crewId),
  ]);
  const failed = e1 ?? e2 ?? e3 ?? e4;
  if (failed) throw failed; // never show a half-empty crew
  if (!crew) return null;

  type CafeRow = { cafe_id: string; name: string; place: string | null; accent: Cafe["accent"]; note: string | null; created_at: string; adder: { id: string; username: string } | null };
  return {
    id: crew.id,
    name: crew.name,
    emoji: crew.emoji,
    inviteCode: crew.invite_code,
    members,
    me,
    cafes: ((cafes ?? []) as unknown as CafeRow[]).map((c) => {
      const h = (hearts ?? []).filter((x) => x.cafe_id === c.cafe_id);
      return {
        cafeId: c.cafe_id,
        name: c.name,
        place: c.place,
        accent: c.accent,
        note: c.note,
        addedBy: c.adder,
        createdAt: c.created_at,
        hearts: h.length,
        heartedByMe: h.some((x) => x.user_id === userId),
      };
    }),
    pending: ((pending ?? []) as unknown as { invitee: { id: string; username: string } }[]).map((p) => p.invitee),
  };
}

/** What an invite link shows before you join (only name, emoji and size). */
export async function crewByInviteCode(code: string): Promise<{ id: string; name: string; emoji: string; memberCount: number } | null> {
  if (!INVITE_CODE.test(code)) return null;
  const db = supabaseAdmin();
  const { data: crew } = await db.from("crews").select("id, name, emoji").eq("invite_code", code).maybeSingle();
  if (!crew) return null;
  const { count } = await db.from("crew_members").select("user_id", { count: "exact", head: true }).eq("crew_id", crew.id);
  return { id: crew.id, name: crew.name, emoji: crew.emoji, memberCount: count ?? 0 };
}

/** Which of my crews already have this cafe (for the add-to-crew picker). */
export async function crewsWithCafe(crewIds: string[], cafeId: string): Promise<Set<string>> {
  if (!crewIds.length) return new Set();
  const { data } = await supabaseAdmin().from("crew_cafes").select("crew_id").in("crew_id", crewIds).eq("cafe_id", cafeId);
  return new Set((data ?? []).map((r) => r.crew_id as string));
}

/** 12 URL-safe random characters. */
export function newInviteCode() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return [...bytes].map((b) => abc[b % abc.length]).join("");
}
