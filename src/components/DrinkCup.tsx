/**
 * Illustrated drink "cut-out" (PRD §8.4 collage). Stands in for real photos
 * until listings have permissioned images. Iced drinks get a clear cup with
 * ice; hot drinks get a ceramic cup with latte art.
 */
import { useId } from "react";
import { DRINKS, type DrinkId } from "@/lib/drinks";

export function DrinkCup({
  drink,
  className = "",
  label,
}: {
  drink: DrinkId;
  className?: string;
  /** accessible label; omit for decorative use */
  label?: string;
}) {
  const info = DRINKS[drink];
  const id = useId().replace(/:/g, "");
  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true as const };

  if (info.iced) {
    return (
      <svg viewBox="0 0 200 260" className={className} {...a11y}>
        <defs>
          <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff8ec" stopOpacity="0.9" />
            <stop offset="0.28" stopColor={info.tint} stopOpacity="0.75" />
            <stop offset="1" stopColor={info.tint} />
          </linearGradient>
          <clipPath id={`cup-${id}`}>
            <path d="M34 52 H166 L150 248 Q100 256 50 248 Z" />
          </clipPath>
        </defs>
        {/* drop shadow */}
        <ellipse cx="104" cy="252" rx="58" ry="7" fill="#47131c" opacity="0.18" />
        {/* straw */}
        <rect x="112" y="6" width="12" height="120" rx="5" transform="rotate(12 118 66)" fill="#fffde9" stroke="#47131c" strokeOpacity="0.25" />
        <g clipPath={`url(#cup-${id})`}>
          <rect x="0" y="70" width="200" height="200" fill={`url(#fill-${id})`} />
          {/* marbled milk swirl */}
          <path d="M40 120 C80 100 110 150 160 118 L160 150 C120 170 80 130 40 150Z" fill="#fff8ec" opacity="0.35" />
          {/* ice cubes */}
          {[
            [56, 64, -12],
            [96, 58, 8],
            [132, 70, -4],
            [70, 100, 14],
            [116, 104, -10],
          ].map(([x, y, r], i) => (
            <rect
              key={i}
              x={x}
              y={y}
              width="30"
              height="28"
              rx="6"
              transform={`rotate(${r} ${x + 15} ${y + 14})`}
              fill="#ffffff"
              fillOpacity="0.45"
              stroke="#ffffff"
              strokeOpacity="0.9"
              strokeWidth="2"
            />
          ))}
        </g>
        {/* cup outline + rim */}
        <path d="M34 52 H166 L150 248 Q100 256 50 248 Z" fill="none" stroke="#47131c" strokeOpacity="0.35" strokeWidth="2.5" />
        <rect x="28" y="44" width="144" height="12" rx="6" fill="#ffffff" fillOpacity="0.7" stroke="#47131c" strokeOpacity="0.35" strokeWidth="2" />
        {/* glare */}
        <path d="M50 70 L62 236" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 220 200" className={className} {...a11y}>
      {/* saucer */}
      <ellipse cx="104" cy="178" rx="92" ry="16" fill="#47131c" opacity="0.15" />
      <ellipse cx="104" cy="170" rx="88" ry="16" fill="#fffde9" stroke="#47131c" strokeOpacity="0.3" strokeWidth="2.5" />
      {/* handle */}
      <path d="M172 82 C204 82 204 132 166 134" fill="none" stroke="#fffde9" strokeWidth="14" strokeLinecap="round" />
      <path d="M172 82 C204 82 204 132 166 134" fill="none" stroke="#47131c" strokeOpacity="0.3" strokeWidth="2" />
      {/* cup body */}
      <path d="M28 64 H180 C180 130 150 166 104 166 C58 166 28 130 28 64Z" fill="#fffde9" stroke="#47131c" strokeOpacity="0.3" strokeWidth="2.5" />
      <path d="M44 92 C58 100 150 100 164 92" stroke="#f08cb8" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* drink surface */}
      <ellipse cx="104" cy="64" rx="76" ry="16" fill={info.tint} stroke="#47131c" strokeOpacity="0.3" strokeWidth="2" />
      {/* latte-art heart */}
      <path d="M104 74 C90 64 88 54 97 52 C101 51 104 55 104 57 C104 55 107 51 111 52 C120 54 118 64 104 74Z" fill="#fff8ec" opacity="0.9" />
      {/* steam */}
      <g fill="none" stroke="#47131c" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round">
        <path d="M84 40 C76 30 92 22 84 10" />
        <path d="M120 40 C112 30 128 22 120 10" />
      </g>
    </svg>
  );
}
