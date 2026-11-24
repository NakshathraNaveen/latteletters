import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PostCard } from "@/components/PostCards";
import { WALL_PAGE_SIZE, wallPage, type PostKind } from "@/lib/posts";

export const metadata: Metadata = {
  title: "The wall of love notes",
  description: "Every love note and review cafe-hoppers have pinned on latteletters, newest first.",
};

const FILTERS: { kind: PostKind | null; label: string }[] = [
  { kind: null, label: "everything" },
  { kind: "note", label: "love notes" },
  { kind: "review", label: "reviews" },
];

const hrefFor = (kind: PostKind | null, page = 1) => {
  const p = new URLSearchParams();
  if (kind) p.set("kind", kind);
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return qs ? `/notes?${qs}` : "/notes";
};

export default function NotesPage(props: PageProps<"/notes">) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="font-serif text-2xl italic">the whole wall of</p>
      <h1 className="font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.9]">love notes</h1>
      <p className="mt-3 max-w-lg">Every note and review cafe-hoppers have pinned up, newest first. Tap a cafe&rsquo;s name to visit its wall.</p>
      <Suspense fallback={<p className="mt-10 font-hand text-2xl">unpinning the notes…</p>}>
        <Wall searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Wall({ searchParams }: { searchParams: PageProps<"/notes">["searchParams"] }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const rawKind = one(sp.kind);
  const kind: PostKind | null = rawKind === "note" || rawKind === "review" ? rawKind : null;
  const page = Math.min(Math.max(1, Math.floor(Number(one(sp.page)) || 1)), 1000);

  const result = await wallPage(kind, page).catch(() => null);
  const pages = result ? Math.max(1, Math.ceil(result.total / WALL_PAGE_SIZE)) : 1;

  return (
    <>
      <nav aria-label="Show" className="mt-8">
        <ul className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = f.kind === kind;
            return (
              <li key={f.label}>
                <Link
                  href={hrefFor(f.kind)}
                  aria-current={active ? "page" : undefined}
                  className={`inline-block rounded-full border-2 border-cola px-4 py-1 font-display transition ${
                    active ? "bg-cola text-cotton" : "bg-lemon hover:bg-cotton-deep"
                  }`}
                >
                  {f.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {result === null ? (
        <p className="mt-10 font-hand text-2xl">the wall is taking a break. Try again in a moment.</p>
      ) : result.posts.length === 0 ? (
        <p className="mt-10 font-hand text-2xl">
          {page > 1 ? (
            <>
              that&rsquo;s the end of the wall. <Link href={hrefFor(kind)} className="underline">back to the newest</Link>
            </>
          ) : kind ? (
            <>
              no {kind === "note" ? "love notes" : "reviews"} pinned yet.{" "}
              <Link href={hrefFor(null)} className="underline">see everything on the wall</Link>
            </>
          ) : (
            <>
              nothing pinned yet. <Link href="/find" className="underline">review a cafe you visited</Link> to start the wall ✦
            </>
          )}
        </p>
      ) : (
        <>
          <p className="mt-6 text-sm font-semibold">
            {result.total} {kind === "note" ? "love note" : kind === "review" ? "review" : "post"}
            {result.total === 1 ? "" : "s"} on the wall
            {pages > 1 && ` · page ${page} of ${pages}`}
          </p>
          <ul className="mt-6 grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.posts.map((p) => (
              <li key={p.id}>
                <PostCard post={p} showCafe />
              </li>
            ))}
          </ul>
          {pages > 1 && (
            <nav aria-label="Pages" className="mt-12 flex flex-wrap items-center justify-between gap-4">
              {page > 1 ? (
                <Link href={hrefFor(kind, page - 1)} rel="prev" className="rounded-full border-2 border-cola bg-lemon px-5 py-1.5 font-display hover:bg-cotton-deep">
                  ← newer
                </Link>
              ) : (
                <span />
              )}
              <span className="font-hand text-xl">
                page {page} of {pages}
              </span>
              {page < pages ? (
                <Link href={hrefFor(kind, page + 1)} rel="next" className="rounded-full border-2 border-cola bg-hotpink px-5 py-1.5 font-display hover:bg-cola hover:text-cotton">
                  older →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </>
  );
}
