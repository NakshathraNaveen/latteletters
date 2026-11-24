import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AddCafeForm } from "@/components/AddCafeForm";
import { DripLoader } from "@/components/DripLoader";
import { requireProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Add a cafe",
  description: "Add a cafe that isn't on the map yet, then leave the first review.",
  robots: { index: false },
};

export default function AddCafePage(props: PageProps<"/add-cafe">) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="font-serif text-2xl">found a hidden gem?</p>
      <h1 className="font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.9]">add a cafe</h1>
      <p className="mt-4 max-w-xl">
        For spots that aren&apos;t on the map yet: tiny cafes, pop-ups, brand-new openings. Looking for a cafe that&apos;s already listed?{" "}
        <Link href="/find" className="font-semibold underline underline-offset-4">
          search for it instead
        </Link>
        .
      </p>
      <div className="mt-10">
        <Suspense fallback={<DripLoader label="getting the map out…" />}>
          <Form searchParams={props.searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<"/add-cafe">["searchParams"] }) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.name) ? sp.name[0] : sp.name;
  const name = (raw ?? "").trim().slice(0, 80);
  await requireProfile(`/add-cafe${name ? `?name=${encodeURIComponent(name)}` : ""}`);
  return <AddCafeForm defaultName={name} />;
}
