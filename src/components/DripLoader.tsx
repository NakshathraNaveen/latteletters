/**
 * "Surreal product moment" loader (PRD §8.4): an IV-style coffee drip bag
 * slowly dripping into a cup. Tasteful, tiny, pure CSS animation.
 */
export function DripLoader({ label = "brewing your results…" }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-16">
      <svg aria-hidden viewBox="0 0 120 170" className="h-40 w-auto">
        {/* hook + line */}
        <path d="M60 0 V14" stroke="var(--color-cola)" strokeWidth="3" />
        {/* drip bag */}
        <path d="M30 14 H90 V62 Q90 84 60 84 Q30 84 30 62 Z" fill="#fffde9" stroke="var(--color-cola)" strokeWidth="3" />
        <path d="M33 44 H87 V62 Q87 81 60 81 Q33 81 33 62 Z" fill="#8a5434" />
        <rect x="40" y="22" width="40" height="14" rx="3" fill="var(--color-hotpink)" />
        <text x="60" y="32.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="var(--color-cola)" fontFamily="sans-serif">
          LATTE
        </text>
        {/* tube */}
        <path d="M60 84 V112" stroke="var(--color-cola)" strokeWidth="3" />
        {/* drop */}
        <g className="animate-drip" style={{ transformOrigin: "60px 112px" }}>
          <path d="M60 112 C64 118 65 121 60 124 C55 121 56 118 60 112Z" fill="#8a5434" />
        </g>
        {/* cup */}
        <path d="M36 140 H84 L80 166 H40 Z" fill="var(--color-hotpink)" stroke="var(--color-cola)" strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="60" cy="140" rx="24" ry="4" fill="#8a5434" />
      </svg>
      <p className="font-hand text-2xl">{label}</p>
    </div>
  );
}
