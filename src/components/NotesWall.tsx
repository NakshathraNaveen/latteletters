import { Suspense } from "react";
import { getViewer } from "@/lib/auth";
import { postsForCafe, type Post } from "@/lib/posts";
import { PostActions } from "./PostActions";
import { PostCard, Stars } from "./PostCards";
import { PostComposer } from "./PostComposer";
import { ViewerProvider } from "./Viewer";

/**
 * Reviews + love notes for one cafe (PRD FR-12–14). The posts are cached
 * per cafe; only the viewer-specific bits (form, edit/report) wait on the
 * session.
 */
export async function NotesWall({ cafeId, cafeName }: { cafeId: string; cafeName: string }) {
  let posts: Post[];
  try {
    posts = await postsForCafe(cafeId);
  } catch {
    return <p className="mt-4">The notes wall is taking a break. Refresh in a moment.</p>;
  }
  const viewer = getViewer(); // not awaited: streams to the client parts
  const reviews = posts.filter((p) => p.kind === "review");
  const avg = reviews.length ? reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length : 0;
  const notes = posts.length - reviews.length;

  return (
    <ViewerProvider viewer={viewer}>
      {posts.length > 0 ? (
        <p className="mt-3 flex flex-wrap items-center gap-x-3 font-hand text-2xl">
          {reviews.length > 0 && (
            <>
              <Stars rating={Math.round(avg)} />
              <span>
                {avg.toFixed(1)} from {reviews.length} review{reviews.length > 1 ? "s" : ""}
              </span>
            </>
          )}
          {reviews.length > 0 && notes > 0 && <span aria-hidden>·</span>}
          {notes > 0 && (
            <span>
              {notes} love note{notes > 1 ? "s" : ""}
            </span>
          )}
        </p>
      ) : (
        <p className="mt-2 max-w-lg">No notes yet. Be the first to tell everyone what to order at {cafeName}!</p>
      )}

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="lg:sticky lg:top-24">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-3xl bg-cotton/30" />}>
            <PostComposer cafeId={cafeId} reviewerIds={reviews.map((r) => r.author.id)} />
          </Suspense>
        </div>
        {posts.length > 0 && (
          <ul className="grid gap-8 text-cola sm:grid-cols-2">
            {posts.map((p) => (
              <li key={p.id} className={p.kind === "review" ? "sm:col-span-2" : ""}>
                <PostCard
                  post={p}
                  actions={
                    <Suspense fallback={null}>
                      <PostActions post={p} />
                    </Suspense>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </ViewerProvider>
  );
}
