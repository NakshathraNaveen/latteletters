import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { UserAvatar } from "@/components/CupAvatar";
import { searchPeople } from "@/lib/people";

export const metadata: Metadata = {
  title: "Find people",
  description: "Find friends on latteletters by username and see their reviews, lists and go-to orders.",
};

export default function PeoplePage(props: PageProps<"/people">) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="font-serif text-2xl">looking for your coffee people?</p>
      <h1 className="font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.9]">find people</h1>
      <Suspense fallback={<SearchForm />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

function SearchForm({ q = "" }: { q?: string }) {
  return (
    <form action="/people" method="get" role="search" className="mt-8">
      <label htmlFor="people-q" className="font-hand text-2xl">
        search by username
      </label>
      <div className="mt-2 flex items-center gap-2 rounded-full border-[3px] border-cola bg-lemon p-1.5 pl-5 shadow-[4px_4px_0_var(--color-cola)]">
        <span aria-hidden className="font-display text-xl">
          @
        </span>
        <input
          id="people-q"
          name="q"
          type="search"
          defaultValue={q}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={21}
          placeholder="username"
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-cola placeholder:text-cola/55 focus:outline-none sm:text-lg"
        />
        <button type="submit" className="shrink-0 rounded-full border-2 border-cola bg-hotpink px-5 py-1.5 font-display transition hover:bg-cola hover:text-cotton">
          find
        </button>
      </div>
    </form>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/people">["searchParams"] }) {
  const sp = await searchParams;
  const raw = (Array.isArray(sp.q) ? sp.q[0] : sp.q) ?? "";
  const q = raw.trim().slice(0, 21);
  const people = q ? await searchPeople(q).catch(() => null) : [];

  return (
    <>
      <SearchForm q={q} />
      <div aria-live="polite" className="mt-8">
        {people === null ? (
          <p className="font-hand text-2xl">the guest book is taking a break. Try again in a moment.</p>
        ) : !q ? null : people.length === 0 ? (
          <p className="font-hand text-2xl">nobody called &ldquo;{q.replace(/^@/, "")}&rdquo; yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {people.map((p, i) => (
              <li key={p.username}>
                <Link
                  href={`/u/${p.username}`}
                  className="paper flex items-center gap-4 rounded-2xl border-2 border-cola bg-lemon px-4 py-3 shadow-[3px_3px_0_var(--color-cola)] transition hover:-translate-y-0.5 hover:bg-cotton-deep"
                  style={{ rotate: `${[-0.6, 0.5, -0.3][i % 3]}deg` }}
                >
                  <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-cotton-deep">
                    <UserAvatar avatar={p.avatar} className="h-[85%] w-auto" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-display text-xl">@{p.username}</span>
                    <span className="block text-sm">
                      {p.reviews} post{p.reviews === 1 ? "" : "s"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
