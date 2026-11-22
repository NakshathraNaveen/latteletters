import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ACCENT_BG } from "@/components/CafeIdCard";
import { UserAvatar } from "@/components/CupAvatar";
import { DripLoader } from "@/components/DripLoader";
import { ActionButton, CopyInviteLink, CrewHeart, InviteByUsername, RenameCrewForm } from "@/components/crews/CrewControls";
import { cancelInvite, deleteCrew, leaveCrew, regenerateInvite, removeCrewCafe, removeMember } from "@/app/actions/crews";
import { requireProfile } from "@/lib/auth";
import { crewForMember } from "@/lib/crews";

export const metadata: Metadata = { title: "Your crew", robots: { index: false } };

const small = "text-xs font-semibold underline underline-offset-2 disabled:opacity-60";

export default function CrewPage(props: PageProps<"/crews/[id]">) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <nav aria-label="Breadcrumb" className="font-hand text-xl">
        <Link href="/crews" className="underline-offset-4 hover:underline">
          ← all my crews
        </Link>
      </nav>
      <Suspense fallback={<DripLoader label="opening the crew folder…" />}>
        <CrewContent params={props.params} />
      </Suspense>
    </div>
  );
}

async function CrewContent({ params }: { params: PageProps<"/crews/[id]">["params"] }) {
  const { id } = await params;
  const user = await requireProfile(`/crews/${id}`);
  const crew = await crewForMember(id, user.id);
  if (!crew) notFound(); // not a member (or no such crew): reveal nothing
  const owner = crew.me.role === "owner";

  return (
    <>
      {/* ── header ── */}
      <header className="mt-6">
        <p className="text-6xl" aria-hidden>
          {crew.emoji}
        </p>
        <h1 className="mt-2 break-words font-display text-5xl leading-[0.95] md:text-6xl">{crew.name}</h1>
        <p className="mt-2 font-hand text-xl">a private crew · only members can see this page</p>
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Members">
          {crew.members.map((m) => (
            <li key={m.id} className="flex items-center gap-2 rounded-full border-2 border-cola bg-lemon py-1 pl-1 pr-3 text-sm">
              <span className="grid size-7 place-items-center rounded-full bg-cotton">
                <UserAvatar avatar={m.avatar} className="h-5 w-auto" />
              </span>
              <Link href={`/u/${m.username}`} className="font-semibold underline-offset-2 hover:underline">
                @{m.username}
              </Link>
              {m.role === "owner" && <span className="rounded-full bg-hotpink px-1.5 text-[10px] font-bold uppercase">owner</span>}
              {m.id === user.id && <span className="text-cola/60">(you)</span>}
              {owner && m.id !== user.id && (
                <ActionButton action={removeMember.bind(null, crew.id, m.id)} confirm={`Remove @${m.username} from ${crew.name}?`} className={small} pendingLabel="…">
                  remove<span className="sr-only"> @{m.username}</span>
                </ActionButton>
              )}
            </li>
          ))}
        </ul>
      </header>

      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ── the shared list ── */}
        <section aria-labelledby="list">
          <h2 id="list" className="font-display text-3xl">
            our cafe list <span aria-hidden className="text-hotpink">♡</span>
          </h2>
          {crew.cafes.length === 0 ? (
            <div className="paper mt-5 rounded-2xl border-2 border-dashed border-cola/50 bg-lemon/60 p-6">
              <p className="font-hand text-2xl">nothing pinned yet!</p>
              <p className="mt-2">
                Open any cafe and tap <b>＋ add to a crew</b> to put it here.{" "}
                <Link href="/search" className="font-semibold underline underline-offset-4">
                  find a cafe →
                </Link>
              </p>
            </div>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {crew.cafes.map((c, i) => (
                <li key={c.cafeId} style={{ transform: `rotate(${[-1, 1, -0.5, 0.8][i % 4]}deg)` }}>
                  <article className="stamp shadow-[var(--shadow-paper)]">
                    <div className={`relative p-4 ${ACCENT_BG[c.accent]}`}>
                      <h3 className="font-display text-xl leading-tight">
                        <Link href={`/cafe/${c.cafeId}`} className="after:absolute after:inset-0 after:content-['']">
                          {c.name}
                        </Link>
                      </h3>
                      {c.place && <p className="mt-0.5 font-mono text-[11px]">{c.place}</p>}
                      {c.note && <p className="mt-3 rounded-lg bg-lemon/80 px-3 py-2 font-note text-xl leading-snug">&ldquo;{c.note}&rdquo;</p>}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span>added by {c.addedBy ? `@${c.addedBy.username}` : "a past member"}</span>
                        <span className="flex items-center gap-3">
                          {(c.addedBy?.id === user.id || owner) && (
                            <span className="relative z-10">
                              <ActionButton action={removeCrewCafe.bind(null, crew.id, c.cafeId)} confirm={`Take ${c.name} off the list?`} className={small} pendingLabel="…">
                                remove<span className="sr-only"> {c.name}</span>
                              </ActionButton>
                            </span>
                          )}
                          <CrewHeart crewId={crew.id} cafeId={c.cafeId} cafeName={c.name} hearts={c.hearts} mine={c.heartedByMe} />
                        </span>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── invite + settings ── */}
        <aside className="space-y-8">
          <section aria-labelledby="invite" className="paper relative rounded-3xl border-2 border-cola bg-cotton-deep p-5 shadow-[var(--shadow-paper)]">
            <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-2" />
            <h2 id="invite" className="font-display text-2xl">
              invite friends
            </h2>
            <div className="mt-4 space-y-5">
              <CopyInviteLink code={crew.inviteCode} />
              <InviteByUsername crewId={crew.id} />
              {crew.pending.length > 0 && (
                <div>
                  <p className="font-label text-xs uppercase tracking-[0.18em]">waiting to join</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {crew.pending.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2">
                        <span>@{p.username} ✉</span>
                        <ActionButton action={cancelInvite.bind(null, crew.id, p.id)} className={small} pendingLabel="…">
                          cancel<span className="sr-only"> invite for @{p.username}</span>
                        </ActionButton>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          <details className="rounded-3xl border-2 border-dashed border-cola p-5">
            <summary className="cursor-pointer font-display text-xl">crew settings</summary>
            <div className="mt-4 space-y-6">
              {owner && (
                <>
                  <RenameCrewForm crewId={crew.id} name={crew.name} emoji={crew.emoji} />
                  <div className="space-y-1">
                    <ActionButton action={regenerateInvite.bind(null, crew.id)} confirm="Make a new invite link? The old one will stop working.">
                      new invite link
                    </ActionButton>
                    <p className="text-xs text-cola/70">Use this if the link ended up somewhere it shouldn&rsquo;t.</p>
                  </div>
                </>
              )}
              <div className="flex flex-wrap gap-3 border-t-2 border-dashed border-cola/25 pt-4">
                <ActionButton
                  action={leaveCrew.bind(null, crew.id)}
                  confirm={owner && crew.members.length > 1 ? `Leave ${crew.name}? The longest-standing member becomes the owner.` : `Leave ${crew.name}?`}
                  pendingLabel="leaving…"
                >
                  leave crew
                </ActionButton>
                {owner && (
                  <ActionButton
                    action={deleteCrew.bind(null, crew.id)}
                    confirm={`Delete ${crew.name} for everyone? Its cafe list and notes go too. This can't be undone.`}
                    className="inline-flex items-center rounded-full border-2 border-cola bg-cola px-4 py-1.5 text-sm font-semibold text-cotton transition hover:bg-ink disabled:opacity-60"
                    pendingLabel="deleting…"
                  >
                    delete crew
                  </ActionButton>
                )}
              </div>
            </div>
          </details>
        </aside>
      </div>
    </>
  );
}
