import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { UserAvatar } from "@/components/CupAvatar";
import { DripLoader } from "@/components/DripLoader";
import { PostActions } from "@/components/PostActions";
import { PostCard } from "@/components/PostCards";
import { ViewerProvider } from "@/components/Viewer";
import { BinderClip, Sticker } from "@/components/decor";
import { ACCENT_BG } from "@/components/CafeIdCard";
import { SaveButton } from "@/components/SaveButton";
import { getCurrentUser, getViewer } from "@/lib/auth";
import { savedCafes, type SavedCafe } from "@/lib/saved";
import { profileWithPosts } from "@/lib/posts";

const USERNAME = /^[a-z0-9_]{3,20}$/;

export async function generateMetadata(props: PageProps<"/u/[username]">): Promise<Metadata> {
  const { username } = await props.params;
  return { title: `@${username}`, description: `@${username}'s cafe reviews and love notes on latteletters` };
}

export default function ProfilePage(props: PageProps<"/u/[username]">) {
  return (
    <Suspense fallback={<DripLoader label="finding their card…" />}>
      <Profile params={props.params} />
    </Suspense>
  );
}

async function Profile({ params }: { params: PageProps<"/u/[username]">["params"] }) {
  const username = decodeURIComponent((await params).username).toLowerCase();
  if (!USERNAME.test(username)) notFound();
  let data: Awaited<ReturnType<typeof profileWithPosts>>;
  try {
    data = await profileWithPosts(username);
  } catch {
    return <p className="mx-auto max-w-xl px-5 py-24 text-center">This profile is taking a break. Refresh in a moment.</p>;
  }
  if (!data) notFound();
  const { profile, posts } = data;
  const reviews = posts.filter((p) => p.kind === "review").length;
  const cafes = new Set(posts.map((p) => p.cafeId)).size;
  const since = new Date(profile.createdAt).toLocaleDateString("en-CA", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-6xl px-5 pt-12">
      {/* member card */}
      <div className="relative mx-auto max-w-md pt-8">
        <div className="swing relative -rotate-2">
          <BinderClip className="absolute -top-8 left-1/2 z-10 w-20 -translate-x-1/2" />
          <div className="paper flex items-center gap-5 rounded-3xl border-2 border-cola bg-lemon p-6 shadow-[var(--shadow-lift)]">
            <div className="stamp w-24 shrink-0 rotate-3">
              <div className="grid aspect-[4/5] place-items-center bg-cotton-deep">
                <UserAvatar avatar={profile.avatar} label className="h-[85%] w-auto" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-hand text-xl leading-none">latteletters member</p>
              <h1 className="mt-1 truncate font-display text-4xl">@{profile.username}</h1>
              <p className="mt-2 font-mono text-sm">since {since}</p>
              <p className="font-mono text-sm">
                {reviews} review{reviews === 1 ? "" : "s"} · {cafes} cafe{cafes === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>
        {reviews >= 3 && (
          <Sticker rotate={12} className="absolute -right-4 top-2 z-20">
            regular ✦
          </Sticker>
        )}
      </div>

      <Suspense fallback={null}>
        <SavedShelf username={profile.username} />
      </Suspense>

      <h2 className="mt-16 font-display text-4xl">their wall</h2>
      {posts.length === 0 ? (
        <p className="mt-3">No notes pinned yet.</p>
      ) : (
        <ViewerProvider viewer={getViewer()}>
          <ul className="mt-8 grid items-start gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li key={p.id}>
                <PostCard
                  post={p}
                  showCafe
                  actions={
                    <Suspense fallback={null}>
                      <PostActions post={p} />
                    </Suspense>
                  }
                />
              </li>
            ))}
          </ul>
        </ViewerProvider>
      )}
    </div>
  );
}

/** Your saved cafes. Private: only rendered for the profile's owner. */
async function SavedShelf({ username }: { username: string }) {
  const viewer = await getCurrentUser().catch(() => null);
  if (!viewer?.profile || viewer.profile.username !== username) return null;
  let saved: SavedCafe[];
  try {
    saved = await savedCafes(viewer.id);
  } catch {
    return <p className="mt-16">Your saved cafes are taking a break. Refresh in a moment.</p>;
  }
  return (
    <section id="saved" aria-labelledby="saved-title" className="mt-16 scroll-mt-24">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
        <h2 id="saved-title" className="font-display text-4xl">
          your saved cafes <span aria-hidden className="text-hotpink">♡</span>
        </h2>
        <p className="font-hand text-xl text-cola/75">only you can see this</p>
      </div>
      {saved.length === 0 ? (
        <p className="mt-3">Tap ♡ on any cafe and it&rsquo;ll wait for you here.</p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {saved.map((c, i) => (
            <li key={c.cafeId} className="relative" style={{ transform: `rotate(${[-1.5, 1, -0.5, 1.5][i % 4]}deg)` }}>
              <div className={`stamp shadow-[var(--shadow-paper)]`}>
                <div className={`relative flex min-h-28 flex-col justify-end p-3 ${ACCENT_BG[c.accent]}`}>
                  <Link href={`/cafe/${c.cafeId}`} className="font-display text-lg leading-tight after:absolute after:inset-0 after:content-['']">
                    {c.name}
                  </Link>
                  {c.place && <p className="mt-1 font-mono text-[11px] leading-snug">{c.place}</p>}
                </div>
              </div>
              <SaveButton cafeId={c.cafeId} cafeName={c.name} saved className="absolute -right-2 -top-2 z-10" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
