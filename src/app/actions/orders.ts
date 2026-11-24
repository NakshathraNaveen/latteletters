"use server";

import { updateTag } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { isProfane } from "@/lib/moderation";
import { ORDER_LIMITS } from "@/components/OrderReceipt";
import { orderTag } from "@/lib/orders";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type OrderState = { error?: string; ok?: string; at?: number };

const FIELDS = ["drink", "size", "milk", "sweetness", "temperature", "extras"] as const;
const LABELS: Record<(typeof FIELDS)[number], string> = {
  drink: "drink",
  size: "size",
  milk: "milk",
  sweetness: "sweetness",
  temperature: "temperature",
  extras: "extras",
};

/** Save (or clear) your go-to order. Every line is optional. */
export async function saveGoToOrder(_: OrderState, form: FormData): Promise<OrderState> {
  const user = await requireProfile("/settings");
  const at = Date.now();
  const clean = (v: FormDataEntryValue | null) => String(v ?? "").trim().replace(/\s+/g, " ");

  const row: Record<string, string | null> = {};
  for (const f of FIELDS) {
    const v = clean(form.get(f));
    if (v.length > ORDER_LIMITS[f]) return { error: `Keep the ${LABELS[f]} under ${ORDER_LIMITS[f]} characters.`, at };
    row[f] = v || null;
  }
  const notes = form
    .getAll("note")
    .map(clean)
    .filter(Boolean)
    .slice(0, ORDER_LIMITS.notes);
  if (notes.some((n) => n.length > ORDER_LIMITS.note)) return { error: `Keep each note under ${ORDER_LIMITS.note} characters.`, at };
  if ([...Object.values(row), ...notes].some((v) => v && isProfane(v))) return { error: "Let's keep it sweet! Please reword that.", at };

  const db = supabaseAdmin().from("go_to_orders");
  const empty = Object.values(row).every((v) => !v) && notes.length === 0;
  const { error } = empty
    ? await db.delete().eq("user_id", user.id)
    : await db.upsert({ user_id: user.id, ...row, notes, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return { error: "Something spilled. Please try again.", at };

  updateTag(orderTag(user.id));
  return { ok: empty ? "Cleared. Your receipt is blank again." : "Saved! It's on your profile now ✦", at };
}
