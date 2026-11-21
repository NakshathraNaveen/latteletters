import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DripLoader } from "@/components/DripLoader";
import { PostCard, postDate } from "@/components/PostCards";
import { requireProfile } from "@/lib/auth";
import { toPost } from "@/lib/posts";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ModerateButtons } from "./ModerateButtons";

export const metadata: Metadata = { title: "Moderation", robots: { index: false } };

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <h1 className="font-display text-5xl font-extrabold tracking-tighter">moderation queue</h1>
      <p className="mt-2 max-w-xl">Posts people have reported. Two reports hide a post automatically until you decide.</p>
      <Suspense fallback={<DripLoader label="checking reports…" />}>
        <Queue />
      </Suspense>
    </div>
  );
}

type QueueRow = Parameters<typeof toPost>[0] & {
  status: "visible" | "hidden";
  report_count: number;
  reports: { reason: string | null; created_at: string }[];
};

async function Queue() {
  const user = await requireProfile("/admin");
  if (!user.profile.isAdmin) notFound();

  const { data, error } = await supabaseAdmin()
    .from("posts")
    .select(
      "id, kind, cafe_id, cafe_name, rating, drink, vibes, body, photos, created_at, updated_at, status, report_count, author:profiles!inner(id, username, avatar), reports(reason, created_at)",
    )
    .gt("report_count", 0)
    .eq("reviewed_by_admin", false)
    .order("report_count", { ascending: false })
    .limit(50);
  if (error) return <p className="mt-6">Couldn&rsquo;t load the queue: {error.message}</p>;
  const rows = data as unknown as QueueRow[];
  if (!rows.length) return <p className="mt-8 font-hand text-3xl">all clear! nothing to review ♡</p>;

  return (
    <ul className="mt-10 space-y-10">
      {rows.map((r) => (
        <li key={r.id} className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <PostCard post={toPost(r)} showCafe />
          <div className="space-y-3 rounded-3xl border-2 border-cola bg-lemon/70 p-5">
            <p className="font-display text-xl">
              {r.report_count} report{r.report_count > 1 ? "s" : ""} · {r.status === "hidden" ? "hidden" : "still visible"}
            </p>
            <ul className="space-y-1 text-sm">
              {r.reports.map((rep, i) => (
                <li key={i}>
                  <span className="text-cola/65">{postDate(rep.created_at)}:</span> {rep.reason || <em>no reason given</em>}
                </li>
              ))}
            </ul>
            <ModerateButtons id={r.id} hidden={r.status === "hidden"} />
          </div>
        </li>
      ))}
    </ul>
  );
}
