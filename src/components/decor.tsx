/**
 * Decorative scrapbook pieces. All are presentational: aria-hidden, no focus.
 */
import { useId, type CSSProperties } from "react";

/* ───────────── scalloped lace divider (PRD §8.4) ───────────── */
export function LaceDivider({
  color = "var(--color-lemon)",
  flip = false,
  className = "",
}: {
  color?: string;
  flip?: boolean;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <div
      aria-hidden
      data-lace
      className={`pointer-events-none relative h-8 w-full ${flip ? "rotate-180" : ""} ${className}`}
    >
      <svg className="h-full w-full" preserveAspectRatio="none" role="presentation">
        <defs>
          <pattern id={`lace-${id}`} width="32" height="32" patternUnits="userSpaceOnUse">
            {/* solid band */}
            <rect width="32" height="11" fill={color} />
            {/* scallop */}
            <path d="M0 11 A16 14 0 0 0 32 11 Z" fill={color} />
            {/* eyelets */}
            <circle cx="8" cy="5.5" r="2.2" fill="var(--color-cola)" fillOpacity="0.18" />
            <circle cx="24" cy="5.5" r="2.2" fill="var(--color-cola)" fillOpacity="0.18" />
            <circle cx="16" cy="15" r="3" fill="var(--color-cola)" fillOpacity="0.14" />
            {/* picot dots under each scallop */}
            <circle cx="16" cy="28.5" r="1.6" fill={color} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#lace-${id})`} />
      </svg>
    </div>
  );
}

/* ───────────── four-point sparkle ───────────── */
export function Sparkle({
  size = 28,
  color = "var(--color-lavender)",
  className = "",
  style,
}: {
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 40 40" className={className} style={style}>
      <path d="M20 0 C21.5 13 27 18.5 40 20 C27 21.5 21.5 27 20 40 C18.5 27 13 21.5 0 20 C13 18.5 18.5 13 20 0Z" fill={color} />
    </svg>
  );
}

/* ───────────── puffy metallic star (from the ID-card inspo) ───────────── */
export function MetalStar({
  size = 44,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 100 100" className={className} style={style}>
      <defs>
        <linearGradient id={`chrome-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#c9c6cf" />
          <stop offset="0.55" stopColor="#8d8995" />
          <stop offset="0.75" stopColor="#e9e6ee" />
          <stop offset="1" stopColor="#77737f" />
        </linearGradient>
      </defs>
      <path
        d="M50 6 C55 6 57 30 62 34 C67 38 92 36 94 41 C96 46 75 59 73 65 C71 71 82 92 77 95 C72 98 55 82 50 82 C45 82 28 98 23 95 C18 92 29 71 27 65 C25 59 4 46 6 41 C8 36 33 38 38 34 C43 30 45 6 50 6Z"
        fill={`url(#chrome-${id})`}
        stroke="#5f5b66"
        strokeWidth="1.5"
      />
      <path d="M40 30 C44 24 48 20 50 18" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.85" />
    </svg>
  );
}

/* ───────────── outlined white star (portfolio inspo) ───────────── */
export function PaperStar({ size = 80, className = "", style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 100 100" className={className} style={style}>
      <path
        d="M50 4 L61 38 L97 38 L68 59 L79 94 L50 72 L21 94 L32 59 L3 38 L39 38 Z"
        fill="var(--color-lemon)"
        stroke="var(--color-cola)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ───────────── sticker pill (lime "coffee" label) ───────────── */
export function Sticker({
  children,
  tone = "lime",
  rotate = -8,
  className = "",
}: {
  children: React.ReactNode;
  tone?: "lime" | "lavender" | "pink" | "lemon";
  rotate?: number;
  className?: string;
}) {
  const tones = {
    lime: "bg-lime text-cola",
    lavender: "bg-lavender text-cola",
    pink: "bg-hotpink text-cola",
    lemon: "bg-lemon text-cola",
  };
  return (
    <span
      className={`inline-block rounded-full border-[3px] border-ink px-4 py-1 font-display text-lg font-extrabold tracking-tight shadow-[3px_4px_0_rgb(43_42_46/0.85)] ${tones[tone]} ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}

/* ───────────── binder clip ───────────── */
export function BinderClip({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 80 70" className={className}>
      {/* wire handles */}
      <path d="M22 40 L18 6 Q40 -4 62 6 L58 40" fill="none" stroke="#9a97a0" strokeWidth="4" strokeLinejoin="round" />
      <path d="M22 40 L18 6 Q40 -4 62 6 L58 40" fill="none" stroke="#e4e2e8" strokeWidth="1.5" />
      {/* clip body */}
      <path d="M8 36 H72 L66 66 H14 Z" fill="#2b2a2e" />
      <path d="M12 39 H68" stroke="#6c6973" strokeWidth="2" />
    </svg>
  );
}
