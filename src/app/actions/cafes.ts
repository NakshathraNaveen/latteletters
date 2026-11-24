"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { cafesNear, distanceKm, roundCoord } from "@/lib/cafes";
import { CAFE_KINDS, type CafeKind } from "@/lib/cafe-kinds";
import { COMMUNITY_TAG, communityTag } from "@/lib/community";
import { isProfane } from "@/lib/moderation";
import { geocode, reverseGeocode, sameName, type Address } from "@/lib/osm";
import { levenshtein } from "@/lib/search";
import { supabaseAdmin } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SWEET = "Let's keep it sweet! Please reword that.";
const SPILLED = "Something spilled. Please try again.";
const CAFES_PER_DAY = 5;

export type AddCafeState = {
  error?: string;
  /** looks like this cafe is already on latteletters */
  duplicate?: { id: string; name: string; metres: number };
  at?: number;
};

const clean = (v: FormDataEntryValue | null) => String(v ?? "").trim().replace(/\s+/g, " ");

/** "Blue Bottle" vs "blue bottle coffee": close enough to ask before adding a second one. */
function looksLikeSame(a: string, b: string) {
  const x = sameName(a);
  const y = sameName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (Math.min(x.length, y.length) >= 4 && (x.includes(y) || y.includes(x))) return true;
  return Math.max(x.length, y.length) >= 6 && levenshtein(x, y) <= 2;
}

/** Add a cafe that isn't on the map yet. On success, goes straight to its page to review it. */
export async function addCafe(_: AddCafeState, form: FormData): Promise<AddCafeState> {
  const user = await requireProfile("/add-cafe");
  const at = Date.now();

  const name = clean(form.get("name"));
  if (name.length < 2 || name.length > 80 || !/[\p{L}\p{N}]/u.test(name)) return { error: "Give the cafe its name (2–80 characters).", at };
  const street = clean(form.get("street")).slice(0, 120) || null;
  const kind = String(form.get("kind") ?? "coffee") as CafeKind;
  if (!CAFE_KINDS.some((k) => k.value === kind)) return { error: "Pick what kind of spot it is.", at };
  const instagram = clean(form.get("instagram")).replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/.*$/, "") || null;
  if (instagram && !/^[A-Za-z0-9_.]{1,30}$/.test(instagram)) return { error: "That Instagram handle doesn't look right (letters, numbers, . and _ only).", at };
  if ([name, street, instagram].some((t) => t && isProfane(t))) return { error: SWEET, at };

  const lat = Number(form.get("lat"));
  const lng = Number(form.get("lng"));
  if (!form.get("lat") || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
    return { error: "Drop the pin on the map where the cafe is.", at };

  const db = supabaseAdmin();
  const dayAgo = new Date(Date.now() - 86400_000).toISOString();
  const { count } = await db.from("community_cafes").select("id", { count: "exact", head: true }).eq("added_by", user.id).gte("created_at", dayAgo);
  if ((count ?? 0) >= CAFES_PER_DAY) return { error: `That's ${CAFES_PER_DAY} new cafes today, thank you! Add more tomorrow.`, at };

  // already here? (unless they've told us it's a different place)
  if (form.get("confirmNew") !== "1") {
    const nearby = await cafesNear(roundCoord(lat), roundCoord(lng), 1).catch(() => []);
    const same = nearby
      .map((c) => ({ c, metres: Math.round(distanceKm(lat, lng, c.lat, c.lng) * 1000) }))
      .filter(({ c, metres }) => metres <= 200 && looksLikeSame(c.name, name))
      .sort((a, b) => a.metres - b.metres)[0];
    if (same) return { duplicate: { id: same.c.id, name: same.c.name, metres: same.metres }, at };
  }

  const address: Address | null = await reverseGeocode(Number(lat.toFixed(5)), Number(lng.toFixed(5))).catch(() => null);
  const { data, error } = await db
    .from("community_cafes")
    .insert({
      name,
      street: street ?? address?.street?.slice(0, 120) ?? null,
      neighbourhood: address?.neighbourhood?.slice(0, 80) ?? null,
      city: address?.city?.slice(0, 80) ?? null,
      country: address?.country?.slice(0, 80) ?? null,
      lat,
      lng,
      kind,
      instagram,
      added_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: SPILLED, at };

  updateTag(COMMUNITY_TAG);
  redirect(`/cafe/c-${data.id}?added=1#love-notes`);
}

/** Find a city or address for the pin picker (a button press, never as-you-type). */
export async function lookupPlace(query: string): Promise<{ lat: number; lng: number; label: string } | { error: string }> {
  await requireProfile("/add-cafe");
  const q = String(query ?? "").trim().slice(0, 120);
  if (q.length < 2) return { error: "Type an address, street or city." };
  const place = await geocode(q).catch(() => undefined);
  if (place === undefined) return { error: "The map is a little busy. Try again in a few seconds." };
  if (!place) return { error: `Couldn't find "${q}". Try adding the city.` };
  return { lat: place.lat, lng: place.lng, label: place.label };
}

/** "This cafe isn't real / is spam". Three reports hide it until an admin looks. */
export async function reportCafe(cafeId: string, reason: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireProfile(`/cafe/${cafeId}`);
  const uuid = String(cafeId).slice(2);
  if (!String(cafeId).startsWith("c-") || !UUID.test(uuid)) return { error: "Couldn't find that cafe." };
  const db = supabaseAdmin();
  const { data: cafe } = await db.from("community_cafes").select("added_by").eq("id", uuid).maybeSingle();
  if (!cafe) return { error: "Couldn't find that cafe." };
  if (cafe.added_by === user.id) return { error: "You added this one! Email us if it needs fixing." };
  const { error } = await db
    .from("community_cafe_reports")
    .insert({ cafe_id: uuid, reporter_id: user.id, reason: String(reason ?? "").trim().slice(0, 300) || null });
  if (error?.code === "23505") return { ok: true };
  if (error) return { error: "Couldn't send the report. Please try again." };
  updateTag(communityTag(uuid));
  updateTag(COMMUNITY_TAG);
  return { ok: true };
}

/** Admin: put a reported cafe back, or keep it hidden. Cafes are never deleted. */
export async function moderateCafe(uuid: string, action: "approve" | "hide"): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireProfile("/admin");
  if (!user.profile.isAdmin) return { error: "Admins only." };
  if (!UUID.test(uuid)) return { error: "Couldn't find that cafe." };
  const { error } = await supabaseAdmin()
    .from("community_cafes")
    .update(action === "approve" ? { status: "visible", report_count: 0, reviewed_by_admin: true } : { status: "hidden", reviewed_by_admin: true })
    .eq("id", uuid);
  if (error) return { error: "Couldn't update that cafe." };
  updateTag(communityTag(uuid));
  updateTag(COMMUNITY_TAG);
  return { ok: true };
}
