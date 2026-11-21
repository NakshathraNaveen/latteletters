"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deletePost, reportPost } from "@/app/actions/posts";
import type { Post } from "@/lib/posts";
import { PostForm } from "./PostForm";
import { input } from "./ui";
import { useViewer } from "./Viewer";

const link = "text-sm font-semibold underline underline-offset-4 disabled:opacity-50";

/** Edit / delete on your own posts, report on everyone else's. */
export function PostActions({ post }: { post: Post }) {
  const viewer = useViewer();
  const router = useRouter();
  const editRef = useRef<HTMLDialogElement>(null);
  const reportRef = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string>();
  const [reason, setReason] = useState("");

  if (!viewer)
    return (
      <Link href={`/login?next=/cafe/${post.cafeId}`} className={`${link} text-cola/70`}>
        report
      </Link>
    );

  const mine = viewer.id === post.author.id;

  if (msg) return <p role="status" className="text-sm font-semibold">{msg}</p>;

  return (
    <div className="flex items-center gap-3">
      {mine ? (
        <>
          <button type="button" className={link} onClick={() => editRef.current?.showModal()}>
            edit
          </button>
          <button
            type="button"
            className={link}
            disabled={pending}
            onClick={() => {
              if (!confirm(post.kind === "review" ? "Delete your review (and its photos)?" : "Delete your love note?")) return;
              start(async () => {
                const r = await deletePost(post.id);
                if (r.error) setMsg(r.error);
              });
            }}
          >
            {pending ? "deleting…" : "delete"}
          </button>
          <dialog
            ref={editRef}
            aria-label={`Edit your ${post.kind === "review" ? "review" : "love note"}`}
            className="m-auto w-[min(40rem,calc(100vw-2rem))] rounded-3xl border-2 border-cola bg-cotton p-6 text-cola shadow-[var(--shadow-lift)] backdrop:bg-cola/50"
          >
            <h2 className="mb-4 font-display text-2xl">edit your {post.kind === "review" ? "review" : "love note"}</h2>
            <PostForm cafeId={post.cafeId} kind={post.kind} initial={post} onDone={() => editRef.current?.close()} />
          </dialog>
        </>
      ) : (
        <>
          {viewer.isAdmin && (
            <button
              type="button"
              className={link}
              disabled={pending}
              onClick={() => {
                if (!confirm("Admin: delete this post?")) return;
                start(async () => {
                  const r = await deletePost(post.id);
                  setMsg(r.error ?? "Deleted.");
                });
              }}
            >
              delete
            </button>
          )}
          <button type="button" className={`${link} text-cola/70`} onClick={() => (viewer.username ? reportRef.current?.showModal() : router.push("/welcome"))}>
            report
          </button>
          <dialog
            ref={reportRef}
            aria-label="Report this post"
            className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-3xl border-2 border-cola bg-cotton p-6 text-cola shadow-[var(--shadow-lift)] backdrop:bg-cola/50"
          >
            <form
              method="dialog"
              onSubmit={(e) => {
                e.preventDefault();
                start(async () => {
                  const r = await reportPost(post.id, reason);
                  reportRef.current?.close();
                  setMsg(r.error ?? "Thanks for telling us. We'll take a look ♡");
                });
              }}
              className="space-y-4"
            >
              <h2 className="font-display text-2xl">report this post?</h2>
              <p className="text-sm">If it&rsquo;s rude, fake, spam or shares something private, let us know. Posts with several reports are hidden until we check them.</p>
              <label className="block text-sm font-semibold">
                what&rsquo;s wrong? <span className="font-normal text-cola/70">(optional)</span>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={3} className={`${input} mt-1`} />
              </label>
              <div className="flex gap-4">
                <button type="submit" disabled={pending} className="rounded-full border-2 border-cola bg-hotpink px-5 py-2 font-display font-bold">
                  {pending ? "sending…" : "send report"}
                </button>
                <button type="button" className={link} onClick={() => reportRef.current?.close()}>
                  cancel
                </button>
              </div>
            </form>
          </dialog>
        </>
      )}
    </div>
  );
}
