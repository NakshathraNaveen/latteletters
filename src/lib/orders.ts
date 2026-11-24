import { cacheLife, cacheTag } from "next/cache";
import type { Order } from "@/components/OrderReceipt";
export { ORDER_LIMITS } from "@/components/OrderReceipt";
import { supabasePublic } from "./supabase/public";

export const orderTag = (userId: string) => `order:${userId}`;

/** Someone's go-to order, or null if they haven't written one. Cached until they edit it. */
export async function goToOrder(userId: string): Promise<Order | null> {
  "use cache";
  cacheTag(orderTag(userId));
  cacheLife("weeks");
  const { data, error } = await supabasePublic()
    .from("go_to_orders")
    .select("drink, size, milk, sweetness, temperature, extras, notes")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? { ...data, notes: data.notes ?? [] } : null;
}
