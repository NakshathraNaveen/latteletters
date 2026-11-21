import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { drinkName, type Post } from "@/lib/posts";
import { photoUrl } from "@/lib/supabase/public";
import { VIBES, type VibeId } from "@/lib/vibes";
import { UserAvatar } from "./CupAvatar";

/** Stable little tilt per post so the wall looks hand-pinned. */
export function tilt(id: string, max = 3) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((Math.abs(h) % (max * 20 + 1)) / 10 - max).toFixed(1);
}

const NOTE_TONES = ["bg-lemon", "bg-cotton-deep", "bg-lavender", "bg-lime"];

export const postDate = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });

export function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <span className={`text-hotpink [text-shadow:1px_1px_0_var(--color-cola)] ${className}`} role="img" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-cola/20 [text-shadow:none]">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function Byline({ post, showCafe }: { post: Post; showCafe?: boolean }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <Link href={`/u/${post.author.username}`} className="inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline">
        <UserAvatar avatar={post.author.avatar} className="h-6 w-auto" />@{post.author.username}
      </Link>
      {showCafe && (
        <>
          <span aria-hidden>·</span>
          <Link href={`/cafe/${post.cafeId}`} className="font-semibold underline underline-offset-4">
            {post.cafeName}
          </Link>
        </>
      )}
      <span className="text-cola/65">
        · <time dateTime={post.createdAt}>{postDate(post.createdAt)}</time>
        {post.edited && " · edited"}
      </span>
    </p>
  );
}

export function ReviewCard({ post, actions, showCafe }: { post: Post; actions?: ReactNode; showCafe?: boolean }) {
  const drink = drinkName(post.drink);
  return (
    <article className="paper relative bg-lemon p-5 pt-6 shadow-[var(--shadow-paper)]" style={{ transform: `rotate(${tilt(post.id, 1.5)}deg)` }}>
      <span className="tape -top-3 left-8 -rotate-6" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Stars rating={post.rating ?? 0} className="text-2xl" />
        {drink && <span className="rounded-full border-2 border-cola bg-cotton px-3 py-0.5 font-hand text-lg">☕ {drink}</span>}
      </div>
      <p className="mt-3 whitespace-pre-line break-words">{post.body}</p>
      {post.vibes.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Vibes">
          {post.vibes.map((v) => (
            <li key={v} className="rounded-full bg-cotton-deep px-2.5 py-0.5 text-xs font-semibold">
              {VIBES[v as VibeId]?.emoji} {VIBES[v as VibeId]?.label ?? v}
            </li>
          ))}
        </ul>
      )}
      {post.photos.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-3">
          {post.photos.map((p, i) => (
            <li key={p} className="bg-white p-1.5 pb-4 shadow-[var(--shadow-paper)]" style={{ transform: `rotate(${[-3, 2, -1][i]}deg)` }}>
              <a href={photoUrl(p)} target="_blank" rel="noopener noreferrer">
                <Image
                  src={photoUrl(p)}
                  alt={`Photo ${i + 1} from @${post.author.username}'s visit${drink ? ` (${drink})` : ""}`}
                  width={160}
                  height={160}
                  sizes="160px"
                  className="size-28 object-cover sm:size-32"
                />
                <span className="sr-only"> (opens full size in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t-2 border-dashed border-cola/20 pt-3">
        <Byline post={post} showCafe={showCafe} />
        {actions}
      </div>
    </article>
  );
}

export function StickyNote({ post, actions, showCafe }: { post: Post; actions?: ReactNode; showCafe?: boolean }) {
  const tone = NOTE_TONES[Math.abs(Number(tilt(post.id, 4)) * 10) % NOTE_TONES.length];
  return (
    <article className={`paper relative min-h-44 p-5 pt-7 shadow-[var(--shadow-paper)] ${tone}`} style={{ transform: `rotate(${tilt(post.id, 3)}deg)` }}>
      <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-3" />
      <p className="whitespace-pre-line break-words font-note text-2xl leading-snug">{post.body}</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
        <Byline post={post} showCafe={showCafe} />
        {actions}
      </div>
    </article>
  );
}

export function PostCard(props: { post: Post; actions?: ReactNode; showCafe?: boolean }) {
  return props.post.kind === "review" ? <ReviewCard {...props} /> : <StickyNote {...props} />;
}
