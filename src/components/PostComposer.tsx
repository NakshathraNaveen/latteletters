"use client";

import Link from "next/link";
import { PostForm } from "./PostForm";
import { useViewer } from "./Viewer";

/** The "pin something" panel: a login nudge, or the review / love note form. */
export function PostComposer({ cafeId, reviewerIds }: { cafeId: string; reviewerIds: string[] }) {
  const viewer = useViewer();
  const back = `/cafe/${cafeId}`;

  if (!viewer || !viewer.username)
    return (
      <div className="paper relative -rotate-1 bg-lemon p-6 text-cola shadow-[var(--shadow-paper)]">
        <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-2" />
        <p className="font-display text-2xl">been here?</p>
        <p className="mt-1">Log in to leave a review or pin a love note. It takes one email, no passwords.</p>
        <Link
          href={viewer ? `/welcome?next=${encodeURIComponent(back)}` : `/login?next=${encodeURIComponent(back)}`}
          className="mt-4 inline-block rounded-full border-2 border-cola bg-hotpink px-5 py-2 font-display font-bold shadow-[3px_3px_0_var(--color-cola)]"
        >
          {viewer ? "finish signing up" : "log in to pin a note"}
        </Link>
      </div>
    );

  return (
    <div className="rounded-3xl border-2 border-cola bg-cotton p-6 text-cola shadow-[var(--shadow-paper)]">
      <PostForm cafeId={cafeId} canReview={!reviewerIds.includes(viewer.id)} />
    </div>
  );
}
