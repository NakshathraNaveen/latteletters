"use server";

import { updateTag } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { postsTag, RECENT_TAG, userTag } from "@/lib/posts";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { deletePost, type FormState } from "./posts";

export async function moderate(id: string, action: "approve" | "hide" | "delete"): Promise<FormState> {
  const user = await requireProfile("/admin");
  if (!user.profile.isAdmin) return { error: "Admins only." };
  if (action === "delete") return deletePost(id);
  if (!/^[0-9a-f-]{36}$/.test(id)) return { error: "Couldn't find that post." };

  const { data, error } = await supabaseAdmin()
    .from("posts")
    .update(
      action === "approve"
        ? { status: "visible", report_count: 0, reviewed_by_admin: true }
        : { status: "hidden", reviewed_by_admin: true },
    )
    .eq("id", id)
    .select("cafe_id, author:profiles!inner(username)")
    .maybeSingle();
  if (error || !data) return { error: "Couldn't update that post." };
  updateTag(postsTag(data.cafe_id as string));
  updateTag(RECENT_TAG);
  updateTag(userTag((data.author as unknown as { username: string }).username));
  return { ok: true };
}
