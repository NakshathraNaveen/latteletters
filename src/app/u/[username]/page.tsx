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
import { goToOrder } from "@/lib/orders";
import { myLists, publicListsOf, type ListSummary } from "@/lib/lists";
import { OrderReceipt } from "@/components/OrderReceipt";

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
        <GoToOrder userId={profile.id} username={profile.username} />
      </Suspense>

      <Suspense fallback={null}>
        <Lists userId={profile.id} username={profile.username} />
      </Suspense>

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

/** Their go-to order receipt, or (on your own profile) a nudge to write one. */
async function GoToOrder({ userId, username }: { userId: string; username: string }) {
  const order = await goToOrder(userId).catch(() => null);
  const viewer = order ? null : await getCurrentUser().catch(() => null);
  if (!order) {
    if (viewer?.profile?.username !== username) return null;
    return (
      <p className="mx-auto mt-12 max-w-md rounded-2xl border-2 border-dashed border-cola/60 bg-lemon/70 p-5 text-center font-hand text-2xl">
        what&rsquo;s your usual?{" "}
        <Link href="/settings#order" className="underline underline-offset-4">
          add your go-to order →
        </Link>
      </p>
    );
  }
  return (
    <section aria-labelledby="order-title" className="mx-auto mt-16 max-w-md">
      <h2 id="order-title" className="text-center font-serif text-[clamp(2.25rem,6vw,3.5rem)] leading-none">
        @{username}&rsquo;s go-to order
      </h2>
      <p className="mt-3 text-center font-display text-lg">the usual, please ✦</p>
      <div className="mt-8 -rotate-1 drop-shadow-[0_18px_22px_rgb(71_19_28/0.3)]">
        <OrderReceipt name={`@${username}`} order={order} seed={`order-${username}`} />
      </div>
    </section>
  );
}

/** Their public cafe lists. On your own profile, your private ones show too (with a lock). */
async function Lists({ userId, username }: { userId: string; username: string }) {
  const viewer = await getCurrentUser().catch(() => null);
  const own = viewer?.id === userId;
  let lists: ListSummary[];
  try {
    lists = own ? await myLists(userId) : await publicListsOf(userId);
  } catch {
    return null;
  }
  if (!lists.length && !own) return null;
  return (
    <section aria-labelledby="lists-title" className="mt-16">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
        <h2 id="lists-title" className="font-display text-4xl">
          {own ? "your lists" : `@${username}’s lists`}
        </h2>
        {own && (
          <Link href="/lists" className="font-hand text-xl underline underline-offset-4">
            manage &amp; make lists →
          </Link>
        )}
      </div>
      {lists.length === 0 ? (
        <p className="mt-3">No lists yet. Tap ☆ add to a list on any cafe page to start one.</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((l, i) => (
            <li key={l.id}>
              <Link
                href={`/lists/${l.id}`}
                className="paper flex h-full items-center gap-4 rounded-2xl border-2 border-cola bg-lemon px-5 py-4 shadow-[3px_3px_0_var(--color-cola)] transition hover:-translate-y-0.5 hover:bg-cotton-deep"
                style={{ rotate: `${[-0.6, 0.5, -0.3][i % 3]}deg` }}
              >
                <span aria-hidden className="text-3xl">
                  {l.emoji}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-xl">{l.title}</span>
                  <span className="block text-sm">
                    {l.cafeCount} cafe{l.cafeCount === 1 ? "" : "s"}
                    {own && (l.isPublic ? " · ✦ public" : " · 🔒 private")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
