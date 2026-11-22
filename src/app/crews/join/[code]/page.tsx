import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DripLoader } from "@/components/DripLoader";
import { ActionButton } from "@/components/crews/CrewControls";
import { btn } from "@/components/ui";
import { joinByCode } from "@/app/actions/crews";
import { getCurrentUser } from "@/lib/auth";
import { crewByInviteCode, membership } from "@/lib/crews";

export const metadata: Metadata = { title: "Join a cafe crew", robots: { index: false } };

export default function JoinPage(props: PageProps<"/crews/join/[code]">) {
  return (
    <div className="mx-auto max-w-lg px-5 py-20">
      <Suspense fallback={<DripLoader label="opening the invite…" />}>
        <Join params={props.params} />
      </Suspense>
    </div>
  );
}

async function Join({ params }: { params: PageProps<"/crews/join/[code]">["params"] }) {
  const { code } = await params;
  const [crew, user] = await Promise.all([crewByInviteCode(code), getCurrentUser()]);

  if (!crew) {
    return (
      <div className="text-center">
        <p className="text-6xl" aria-hidden>
          ✉
        </p>
        <h1 className="mt-4 font-display text-4xl">this invite link has expired</h1>
        <p className="mt-3">Ask your friend to send you a fresh one from their crew page.</p>
        <Link href="/crews" className={`${btn} mt-6`}>
          go to my crews
        </Link>
      </div>
    );
  }

  const already = user?.profile ? await membership(crew.id, user.id) : null;
  const next = `/crews/join/${code}`;

  return (
    <div className="paper relative rounded-3xl border-2 border-cola bg-cotton-deep p-8 text-center shadow-[var(--shadow-lift)]">
      <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-2" />
      <p className="font-hand text-2xl">you&rsquo;re invited to join</p>
      <p className="mt-4 text-6xl" aria-hidden>
        {crew.emoji}
      </p>
      <h1 className="mt-2 break-words font-display text-4xl leading-tight">{crew.name}</h1>
      <p className="mt-1 font-mono text-sm">
        a cafe crew · {crew.memberCount} {crew.memberCount === 1 ? "member" : "members"}
      </p>
      <p className="mx-auto mt-5 max-w-sm">A private group for sharing cafes: add spots to the crew&rsquo;s list, leave notes and heart each other&rsquo;s picks.</p>

      <div className="mt-7 flex justify-center">
        {!user ? (
          <Link href={`/login?next=${encodeURIComponent(next)}`} className={btn}>
            log in to join ✦
          </Link>
        ) : !user.profile ? (
          <Link href={`/welcome?next=${encodeURIComponent(next)}`} className={btn}>
            pick a username to join ✦
          </Link>
        ) : already ? (
          <Link href={`/crews/${crew.id}`} className={btn}>
            you&rsquo;re in! open the crew →
          </Link>
        ) : (
          <ActionButton action={joinByCode.bind(null, code)} className={btn} pendingLabel="joining…">
            join the crew ✦
          </ActionButton>
        )}
      </div>
    </div>
  );
}
