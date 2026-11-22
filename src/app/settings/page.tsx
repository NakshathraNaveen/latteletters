import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DripLoader } from "@/components/DripLoader";
import { ProfileForm } from "@/components/ProfileForm";
import { btnQuiet } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { DeleteAccount } from "./DeleteAccount";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="font-display text-5xl font-extrabold tracking-tighter">settings</h1>
      <Suspense fallback={<DripLoader label="opening your file…" />}>
        <Settings />
      </Suspense>
    </div>
  );
}

async function Settings() {
  const user = await requireProfile("/settings");
  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Link href={`/u/${user.profile.username}`} className={btnQuiet}>
          view my profile →
        </Link>
        <Link href={`/u/${user.profile.username}#saved`} className={btnQuiet}>
          my saved cafes ♡
        </Link>
        <Link href="/crews" className={btnQuiet}>
          my cafe crews
        </Link>
        {user.profile.isAdmin && (
          <Link href="/admin" className={btnQuiet}>
            moderation queue
          </Link>
        )}
        <form action="/auth/signout" method="post">
          <button type="submit" className={btnQuiet}>
            log out
          </button>
        </form>
      </div>
      {user.email && <p className="mt-4 text-sm text-cola/80">Logged in as {user.email} (only you can see this).</p>}

      <section aria-labelledby="profile" className="mt-10 rounded-3xl border-2 border-cola bg-lemon/70 p-6">
        <h2 id="profile" className="mb-5 font-display text-2xl">
          your card
        </h2>
        <ProfileForm initial={user.profile} />
      </section>

      <section aria-labelledby="danger" className="mt-10 rounded-3xl border-2 border-dashed border-cola p-6">
        <h2 id="danger" className="mb-3 font-display text-2xl">
          delete account
        </h2>
        <DeleteAccount username={user.profile.username} />
      </section>
    </>
  );
}
