/**
 * Quick-pick chips (FR-4): mood chips + drink chips, styled as stickers.
 */
import Link from "next/link";
import { DRINKS, DRINK_CHIPS } from "@/lib/drinks";
import { MOOD_CHIPS } from "@/lib/vibes";

const tilt = [-4, 3, -2, 5, -3, 2, -5, 4, -1, 3];

function Chip({ href, children, tone, i }: { href: string; children: React.ReactNode; tone: string; i: number }) {
  return (
    <li data-fx-item>
      <Link
        href={href}
        className={`wiggle inline-flex items-center gap-1.5 rounded-full border-2 border-cola px-4 py-1.5 text-sm font-semibold text-cola shadow-[2px_3px_0_var(--color-cola)] transition-colors hover:bg-cola hover:text-cotton ${tone}`}
        style={{ "--r": `${tilt[i % tilt.length]}deg` } as React.CSSProperties}
      >
        {children}
      </Link>
    </li>
  );
}

export function Chips({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-hand text-2xl text-cola">{"i'm feeling…"}</span>
        <ul data-fx="stickers" className="flex flex-wrap gap-2" aria-label="Search by mood">
          {MOOD_CHIPS.map((m, i) => (
            <Chip key={m.label} href={`/search?q=${encodeURIComponent(m.query)}`} tone="bg-lemon" i={i}>
              <span aria-hidden>{m.emoji}</span> {m.label}
            </Chip>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-hand text-2xl text-cola">{"i'm craving…"}</span>
        <ul data-fx="stickers" className="flex flex-wrap gap-2" aria-label="Search by drink">
          {DRINK_CHIPS.map((d, i) => (
            <Chip key={d} href={`/search?q=${encodeURIComponent(DRINKS[d].name.toLowerCase())}`} tone="bg-lime" i={i + 5}>
              {DRINKS[d].name.toLowerCase()}
            </Chip>
          ))}
        </ul>
      </div>
    </div>
  );
}
