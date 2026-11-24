import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CafeFinder } from "@/components/CafeFinder";
import { DrinkCup } from "@/components/DrinkCup";
import { findCafes } from "@/lib/cafes";

export const metadata: Metadata = {
  title: "Review a cafe you visited",
  description: "Find the cafe you went to by name and leave a review or a love note.",
};

export default function FindPage(props: PageProps<"/find">) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-serif text-2xl">been somewhere lovely?</p>
          <h1 className="font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.9]">review a cafe you visited</h1>
        </div>
        <DrinkCup drink="iced-latte" className="hidden h-28 w-auto rotate-6 sm:block" />
      </div>
      <div className="mt-10">
        <Suspense fallback={<CafeFinder />}>
          <Finder searchParams={props.searchParams} />
        </Suspense>
      </div>
      <p className="mt-10 font-hand text-xl">
        looking for a friend instead?{" "}
        <Link href="/people" className="underline underline-offset-4">
          find people by username →
        </Link>
      </p>
      <p className="mt-6 text-right text-xs text-cola/70">
        Search by{" "}
        <a href="https://photon.komoot.io" className="underline" target="_blank" rel="noopener noreferrer">
          Photon
        </a>{" "}
        · cafe data from the{" "}
        <a href="https://docs.overturemaps.org/attribution/" className="underline" target="_blank" rel="noopener noreferrer">Overture Maps Foundation</a>{" "}
        and ©{" "}
        <a href="https://www.openstreetmap.org/copyright" className="underline" target="_blank" rel="noopener noreferrer">
          OpenStreetMap contributors
        </a>
      </p>
    </div>
  );
}

/** Server-rendered results for /find?q=… (shared links, and browsers without JS). */
async function Finder({ searchParams }: { searchParams: PageProps<"/find">["searchParams"] }) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const q = (raw ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  const initial = q.length >= 2 ? await findCafes(q, null) : undefined;
  return <CafeFinder key={q} initialQuery={q} initial={initial} />;
}
