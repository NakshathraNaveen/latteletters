import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { UserAvatar } from "@/components/CupAvatar";
import { DripLoader } from "@/components/DripLoader";
import { ActionButton, CreateCrewForm } from "@/components/crews/CrewControls";
import { btn } from "@/components/ui";
import { acceptInvite, declineInvite } from "@/app/actions/crews";
import { getCurrentUser } from "@/lib/auth";
import { myCrews, pendingInvites } from "@/lib/crews";

export const metadata: Metadata = { title: "Cafe crews", robots: { index: false } };

const TONES = ["bg-lemon", "bg-lavender/70", "bg-hotpink/70", "bg-lime/60", "bg-[#c5d28a]/80", "bg-cotton-deep"];

export default function CrewsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="font-serif text-2xl">share cafes with your people</p>
      <h1 className="font-display text-5xl font-extrabold tracking-tighter md:text-6xl">cafe crews</h1>
      <Suspense fallback={<DripLoader label="finding your crews…" />}>
        <Crews />
      </Suspense>
    </div>
  );
}

async function Crews() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mt-8 max-w-xl space-y-4 text-lg">
        <p>
          A crew is a little private group for you and your friends. Add cafes to a shared list, leave notes like &ldquo;the
          matcha here!!&rdquo;, and heart each other&rsquo;s picks.
        </p>
        <Link href="/login?next=/crews" className={btn}>
          log in to start a crew ✦
        </Link>
      </div>
    );
  }
  if (!user.profile) redirect("/welcome?next=/crews");

  const [crews, invites] = await Promise.all([myCrews(user.id), pendingInvites(user.id)]);

  return (
    <>
      {invites.length > 0 && (
        <section aria-labelledby="invites" className="mt-10">
          <h2 id="invites" className="font-hand text-3xl">
            you&rsquo;ve got mail ✉
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {invites.map((inv) => (
              <li key={inv.crewId} className="paper relative rounded-2xl border-2 border-cola bg-cotton-deep p-5 shadow-[var(--shadow-paper)]">
                <span className="tape -top-3 left-6 -rotate-3" />
                <p>
                  <b>@{inv.from}</b> invited you to
                </p>
                <p className="mt-1 font-display text-2xl">
                  <span aria-hidden>{inv.emoji}</span> {inv.name}
                </p>
                <p className="text-sm text-cola/75">
                  {inv.memberCount} {inv.memberCount === 1 ? "member" : "members"}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <ActionButton action={acceptInvite.bind(null, inv.crewId)} className={btn} pendingLabel="joining…">
                    join ✦<span className="sr-only"> {inv.name}</span>
                  </ActionButton>
                  <ActionButton action={declineInvite.bind(null, inv.crewId)}>
                    no thanks<span className="sr-only"> to {inv.name}</span>
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="yours" className="mt-12">
        <h2 id="yours" className="font-display text-3xl">
          your crews
        </h2>
        {crews.length === 0 ? (
          <p className="mt-3 max-w-xl">
            No crews yet! Start one below, then send the invite link to your friends. If a friend already has a crew, ask them for
            their link.
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {crews.map((c, i) => (
              <li key={c.id} className="relative pt-3" style={{ transform: `rotate(${[-1.5, 1, -0.5, 1.5][i % 4]}deg)` }}>
                {/* folder tab */}
                <span aria-hidden className={`absolute left-5 top-0 h-5 w-24 rounded-t-xl border-2 border-b-0 border-cola/70 ${TONES[i % TONES.length]}`} />
                <div className={`paper relative rounded-2xl rounded-tl-md border-2 border-cola/70 p-5 shadow-[var(--shadow-paper)] transition hover:-translate-y-1 ${TONES[i % TONES.length]}`}>
                  <p className="text-4xl" aria-hidden>
                    {c.emoji}
                  </p>
                  <h3 className="mt-1 font-display text-2xl leading-tight">
                    <Link href={`/crews/${c.id}`} className="after:absolute after:inset-0 after:content-['']">
                      {c.name}
                    </Link>
                  </h3>
                  <div className="mt-3 flex items-center gap-2">
                    <ul className="flex -space-x-2" aria-label="Members">
                      {c.members.slice(0, 6).map((m) => (
                        <li key={m.id} className="grid size-8 place-items-center rounded-full border-2 border-cola bg-cotton" title={`@${m.username}`}>
                          <UserAvatar avatar={m.avatar} className="h-6 w-auto" />
                          <span className="sr-only">@{m.username}</span>
                        </li>
                      ))}
                    </ul>
                    {c.members.length > 6 && <span className="text-sm">+{c.members.length - 6}</span>}
                  </div>
                  <p className="mt-3 font-mono text-xs">
                    {c.members.length} {c.members.length === 1 ? "member" : "members"} · {c.cafeCount} {c.cafeCount === 1 ? "cafe" : "cafes"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="start" className="mt-14 max-w-xl rounded-3xl border-2 border-cola bg-lemon/70 p-6">
        <h2 id="start" className="mb-4 font-display text-2xl">
          start a crew
        </h2>
        <CreateCrewForm />
      </section>
    </>
  );
}
