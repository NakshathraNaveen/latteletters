import Link from "next/link";

export type ControlChip = { key: string; label: string; href: string; active: boolean; count?: number };

const chip = (active: boolean) =>
  `inline-flex items-center gap-1 whitespace-nowrap rounded-full border-2 border-cola px-3 py-1 text-xs font-semibold transition sm:text-sm ${
    active ? "bg-cola text-cotton shadow-none" : "bg-lemon shadow-[2px_2px_0_var(--color-cola)] hover:-translate-y-0.5 hover:bg-cotton-deep"
  }`;

function Row({ label, chips, toggle = false }: { label: string; chips: ControlChip[]; toggle?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-hand text-lg leading-none sm:text-xl">{label}</span>
      <ul className="flex flex-wrap gap-1.5 sm:gap-2">
        {chips.map((c) => (
          <li key={c.key}>
            <Link
              href={c.href}
              scroll={false}
              aria-current={!toggle && c.active ? "true" : undefined}
              className={chip(c.active)}
            >
              {toggle && c.active && <span aria-hidden>✓</span>}
              {toggle && <span className="sr-only">{c.active ? "Remove filter: " : "Add filter: "}</span>}
              {c.label}
              {c.count !== undefined && <span className={c.active ? "opacity-80" : "text-cola/60"}>({c.count})</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Sort / filter / list-or-map controls above the results. Plain links, so they work without JS. */
export function ResultControls({ sort, filters, view }: { sort: ControlChip[]; filters: ControlChip[]; view: ControlChip[] }) {
  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Row label="sort by" chips={sort} />
        <Row label="show as" chips={view} />
      </div>
      <Row label="only show" chips={filters} toggle />
    </div>
  );
}
