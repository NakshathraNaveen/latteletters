import Link from "next/link";
import { Suspense } from "react";
import { AccountButton } from "./AccountButton";
import { SearchBar } from "./SearchBar";
import { Sparkle } from "./decor";

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

/** Header (FR-1): logo + compact search on every page. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-cola/15 bg-cotton/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3">
        <Logo />
        <nav aria-label="Main" className="order-3 flex w-full items-center justify-between gap-4 sm:order-none sm:w-auto">
          <ul className="flex gap-4 font-label text-[11px] uppercase tracking-wider">
            <li>
              <Link href="/search" className="underline-offset-4 hover:underline">
                find cafes
              </Link>
            </li>
            <li>
              <Link href="/#how" className="underline-offset-4 hover:underline">
                how it works
              </Link>
            </li>
            <li>
              <Link href="/about" className="underline-offset-4 hover:underline">
                meet the creator
              </Link>
            </li>
          </ul>
          <div className="flex items-center gap-3">
            <Suspense fallback={<span aria-hidden className="inline-block h-7 w-16 rounded-full border-2 border-cola/20" />}>
              <AccountButton />
            </Suspense>
            <LatteLevel />
          </div>
        </nav>
        <div className="hidden md:block">
          <SearchBar variant="compact" />
        </div>
      </div>
    </header>
  );
}
