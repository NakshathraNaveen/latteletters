import Link from "next/link";
import { Suspense } from "react";
import { AccountButton } from "./AccountButton";
import { Sparkle } from "./decor";
import { getCurrentUser } from "@/lib/auth";
import { pendingInviteCount } from "@/lib/crews";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-baseline gap-0.5 ${className}`} aria-label="latteletters home">
      <span className="font-display text-2xl font-extrabold tracking-tighter text-cola">latte</span>
      <span className="font-serif text-2xl italic text-cola">letters</span>
      <Sparkle size={14} color="var(--color-hotpink)" className="ml-0.5 self-start transition-transform group-hover:rotate-45" />
    </Link>
  );
}

/** Tiny cup that fills with latte as you scroll down the page (driven by ScrollFx). */
function LatteLevel() {
  return (
    <span aria-hidden className="relative block h-7 w-6" title="latte level">
      {/* cup interior (HTML so GSAP can scale the fill cleanly) */}
      <span className="absolute left-[3px] right-[3px] top-[5px] bottom-[2px] overflow-hidden bg-lemon [clip-path:polygon(0_0,100%_0,89%_100%,11%_100%)]">
        <span
          data-scroll-progress
          className="absolute inset-0 bg-[#c99a6b]"
          style={{ transformOrigin: "50% 100%", transform: "scaleY(0)" }}
        />
      </span>
      <svg viewBox="0 0 24 28" className="absolute inset-0 h-full w-full">
        <path d="M3 5 H21 L19 26 H5 Z" fill="none" stroke="var(--color-cola)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M2 4 H22" stroke="var(--color-cola)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M14 4 L17 0" stroke="var(--color-hotpink)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/** Header (FR-1): logo, nav, account, and a search shortcut on phones.
 *  Phones get the same pieces in two tidy rows; nothing wraps mid-label. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-cola/15 bg-cotton/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 sm:px-5 sm:py-3">
        <Logo />
        <nav aria-label="Main" className="order-3 w-full sm:order-none sm:w-auto">
          <ul className="flex justify-between gap-3 whitespace-nowrap font-label text-[11px] uppercase tracking-wider sm:justify-start sm:gap-4">
            <li>
              <Link href="/search" className="underline-offset-4 hover:underline">
                find cafes
              </Link>
            </li>
            <li>
              <Link href="/find" className="underline-offset-4 hover:underline">
                <span className="sm:hidden">review</span>
                <span className="hidden sm:inline">review a cafe</span>
              </Link>
            </li>
            <li className="hidden sm:list-item">
              <Link href="/notes" className="underline-offset-4 hover:underline">
                love notes
              </Link>
            </li>
            <li>
              <Link href="/#how" className="underline-offset-4 hover:underline">
                how it works
              </Link>
            </li>
            <li>
              <Link href="/about" className="underline-offset-4 hover:underline">
                <span className="sm:hidden">creator</span>
                <span className="hidden sm:inline">meet the creator</span>
              </Link>
            </li>
            <li>
              <Link href="/crews" className="relative underline-offset-4 hover:underline">
                crews
                <Suspense fallback={null}>
                  <CrewInviteBadge />
                </Suspense>
              </Link>
            </li>
          </ul>
        </nav>
        <div className="flex items-center gap-3 whitespace-nowrap">
          <Link
            href="/search"
            aria-label="Search cafes"
            className="grid size-8 place-items-center rounded-full border-2 border-cola bg-lemon shadow-[2px_2px_0_var(--color-cola)] md:hidden"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M15.5 15.5 L21 21" />
            </svg>
          </Link>
          <Suspense fallback={<span aria-hidden className="inline-block h-7 w-16 rounded-full border-2 border-cola/20" />}>
            <AccountButton />
          </Suspense>
          <LatteLevel />
        </div>
      </div>
    </header>
  );
}

/** "✉ 2" on the crews link when someone has invited you. */
async function CrewInviteBadge() {
  const user = await getCurrentUser().catch(() => null);
  if (!user?.profile) return null;
  const n = await pendingInviteCount(user.id).catch(() => 0);
  if (!n) return null;
  return (
    <span className="absolute -right-3 -top-2.5 rounded-full border border-cola bg-hotpink px-1 text-[9px] leading-tight tracking-normal">
      <span aria-hidden>✉{n}</span>
      <span className="sr-only">
        {" "}
        ({n} crew {n === 1 ? "invite" : "invites"} waiting)
      </span>
    </span>
  );
}
