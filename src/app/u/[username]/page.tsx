import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DrinkCup } from "@/components/DrinkCup";
import { DripLoader } from "@/components/DripLoader";
import { PostActions } from "@/components/PostActions";
import { PostCard } from "@/components/PostCards";
import { ViewerProvider } from "@/components/Viewer";
import { BinderClip, Sticker } from "@/components/decor";
import { getViewer } from "@/lib/auth";
import { avatarDrink, profileWithPosts } from "@/lib/posts";

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
                <DrinkCup drink={avatarDrink(profile.avatar)} className="h-[85%] w-auto" />
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
