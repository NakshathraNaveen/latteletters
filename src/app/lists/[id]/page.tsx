import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ACCENT_BG } from "@/components/CafeIdCard";
import { UserAvatar } from "@/components/CupAvatar";
import { DripLoader } from "@/components/DripLoader";
import { DeleteListButton } from "@/components/lists/DeleteListButton";
import { ListDetailsForm } from "@/components/lists/ListDetailsForm";
import { ListItemControls } from "@/components/lists/ListItemControls";
import { updateList } from "@/app/actions/lists";
import { getCurrentUser } from "@/lib/auth";
import { listForViewer } from "@/lib/lists";

export const metadata: Metadata = { title: "Cafe list" };

export default function ListPage(props: PageProps<"/lists/[id]">) {
  return (
    <Suspense fallback={<DripLoader label="opening the list…" />}>
      <List params={props.params} />
    </Suspense>
  );
}

async function List({ params }: { params: PageProps<"/lists/[id]">["params"] }) {
  const { id } = await params;
  const viewer = await getCurrentUser().catch(() => null);
  const list = await listForViewer(id, viewer?.id).catch(() => null);
  if (!list) notFound();
  const mine = viewer?.id === list.owner.id;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <p className="flex items-center gap-2 font-hand text-2xl">
        <UserAvatar avatar={list.owner.avatar} className="h-8 w-auto" />
        <Link href={`/u/${list.owner.username}`} className="underline-offset-4 hover:underline">
          @{list.owner.username}
        </Link>
        &rsquo;s list · {list.isPublic ? "✦ public" : "🔒 only you can see this"}
      </p>
      <h1 className="mt-2 break-words font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.9]">
        <span aria-hidden>{list.emoji}</span> {list.title}
      </h1>
      {list.description && <p className="mt-4 max-w-2xl whitespace-pre-line text-lg">{list.description}</p>}

      {list.items.length === 0 ? (
        <p className="mt-10 font-hand text-2xl">
          no cafes on it yet.{" "}
          {mine && (
            <>
              Find one with{" "}
              <Link href="/search" className="underline underline-offset-4">
                search
              </Link>{" "}
              and tap <b>☆ add to a list</b>.
            </>
          )}
        </p>
      ) : (
        <ol className="mt-10 grid gap-6 sm:grid-cols-2">
          {list.items.map((item, i) => (
            <li key={item.cafeId} className={`paper rounded-3xl border-2 border-cola p-5 shadow-[var(--shadow-paper)] ${ACCENT_BG[item.accent]}`} style={{ rotate: `${[-0.8, 0.6, -0.4, 0.9][i % 4]}deg` }}>
              <p className="font-mono text-sm">no. {i + 1}</p>
              <Link href={`/cafe/${item.cafeId}`} className="mt-1 block font-display text-2xl leading-tight underline-offset-4 hover:underline">
                {item.name}
              </Link>
              {item.place && <p className="text-sm">{item.place}</p>}
              {item.recommend && (
                <p className="mt-3 rounded-xl border-2 border-dashed border-cola/60 bg-lemon/80 px-3 py-2">
                  <span className="font-label text-[11px] uppercase tracking-wider">order: </span>
                  <span className="font-semibold">{item.recommend}</span>
                </p>
              )}
              {item.note && <p className="mt-2 font-note text-xl leading-snug">{item.note}</p>}
              {mine && <ListItemControls listId={list.id} cafeId={item.cafeId} recommend={item.recommend} note={item.note} />}
            </li>
          ))}
        </ol>
      )}

      {mine && (
        <section aria-labelledby="edit" className="mt-16 max-w-xl rounded-3xl border-2 border-cola bg-lemon/70 p-6">
          <h2 id="edit" className="mb-4 font-display text-2xl">
            edit this list
          </h2>
          <ListDetailsForm action={updateList.bind(null, list.id)} initial={list} submitLabel="save changes" />
          <div className="mt-6 border-t-2 border-dashed border-cola/30 pt-4">
            <DeleteListButton listId={list.id} />
          </div>
        </section>
      )}
    </div>
  );
}
