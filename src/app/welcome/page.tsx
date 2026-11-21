import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DripLoader } from "@/components/DripLoader";
import { ProfileForm } from "@/components/ProfileForm";
import { requireUser, safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Welcome", robots: { index: false } };

export default function WelcomePage(props: PageProps<"/welcome">) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <p className="font-serif text-2xl italic">welcome to the club</p>
      <h1 className="font-display text-5xl font-extrabold tracking-tighter md:text-6xl">make your card</h1>
      <p className="mb-8 mt-2">Pick a username and a cup. You can change both later.</p>
      <Suspense fallback={<DripLoader label="brewing…" />}>
        <Welcome searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Welcome({ searchParams }: { searchParams: PageProps<"/welcome">["searchParams"] }) {
  const next = safeNext((await searchParams).next);
  const user = await requireUser(`/welcome?next=${encodeURIComponent(next)}`);
  if (user.profile) redirect(next);
  return <ProfileForm next={next} submitLabel="let's go ✦" />;
}
