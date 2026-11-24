import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DripLoader } from "@/components/DripLoader";
import { ListDetailsForm } from "@/components/lists/ListDetailsForm";
import { createList } from "@/app/actions/lists";
import { requireProfile } from "@/lib/auth";
import { myLists } from "@/lib/lists";

export const metadata: Metadata = { title: "Your cafe lists", robots: { index: false } };

export default function ListsPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <p className="font-serif text-2xl">study spots, date nights, the best matcha…</p>
      <h1 className="font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.9]">your cafe lists</h1>
      <Suspense fallback={<DripLoader label="flipping through your lists…" />}>
        <Lists />
      </Suspense>
    </div>
  );
}

async function Lists() {
  const user = await requireProfile("/lists");
  const lists = await myLists(user.id).catch(() => null);
  return (
    <div className="mt-10 grid items-start gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <section aria-labelledby="mine">
        <h2 id="mine" className="sr-only">
          Your lists
        </h2>
        {lists === null ? (
          <p>Your lists are taking a break. Refresh in a moment.</p>
        ) : lists.length === 0 ? (
          <p className="font-hand text-2xl">
            no lists yet! Start one here, or tap <b>☆ add to a list</b> on any cafe page.
          </p>
        ) : (
          <ul className="space-y-3">
            {lists.map((l, i) => (
              <li key={l.id}>
                <Link
                  href={`/lists/${l.id}`}
                  className="paper flex items-center gap-4 rounded-2xl border-2 border-cola bg-lemon px-5 py-4 shadow-[3px_3px_0_var(--color-cola)] transition hover:-translate-y-0.5 hover:bg-cotton-deep"
                  style={{ rotate: `${[-0.5, 0.4, -0.3][i % 3]}deg` }}
                >
                  <span aria-hidden className="text-3xl">
                    {l.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-xl">{l.title}</span>
                    <span className="block text-sm">
                      {l.cafeCount} cafe{l.cafeCount === 1 ? "" : "s"} · {l.isPublic ? "✦ public" : "🔒 private"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="new" className="rounded-3xl border-2 border-cola bg-lemon/70 p-6">
        <h2 id="new" className="mb-4 font-display text-2xl">
          start a new list
        </h2>
        <ListDetailsForm action={createList} submitLabel="make my list ✦" />
      </section>
    </div>
  );
}
