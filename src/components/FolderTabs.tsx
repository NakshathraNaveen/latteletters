/**
 * Folder-tab picker (PRD §8.4): stacked textured folders; the active folder
 * rises. Each tab is a plain link, so it works without JS. Used for the
 * search-distance picker ("walkable", "short ride", "worth the trip").
 */
import Link from "next/link";

const FOLDER_COLOURS = [
  "bg-cola text-cotton",
  "bg-hotpink text-cola",
  "bg-lemon text-cola",
  "bg-olive text-cola",
  "bg-ink text-cotton",
];

export type FolderTab = { label: string; href: string; active?: boolean; note?: string };

export function FolderTabs({ tabs, label }: { tabs: FolderTab[]; label: string }) {
  return (
    <nav aria-label={label}>
      <ul data-fx="folders" className="flex items-end gap-0 overflow-x-auto pb-0 pl-2 pt-6">
        {tabs.map((t, i) => (
          <li key={t.label} data-fx-item className="-ml-2 first:ml-0" style={{ zIndex: t.active ? 20 : 10 - i }}>
            <Link
              href={t.href}
              aria-current={t.active ? "page" : undefined}
              className={`paper relative block whitespace-nowrap rounded-t-2xl border-2 border-b-0 border-cola/70 px-3 pb-3 pt-2 font-label text-[10px] font-medium uppercase tracking-wider sm:px-5 sm:text-xs shadow-[0_-2px_6px_rgb(71_19_28/0.15)] transition-transform duration-300 hover:-translate-y-1.5 ${
                FOLDER_COLOURS[i % FOLDER_COLOURS.length]
              } ${t.active ? "-translate-y-3 pb-5" : ""}`}
            >
              {t.label}
              {t.note && <span className="ml-1.5 hidden font-hand text-base font-normal normal-case opacity-80 sm:inline">({t.note})</span>}
            </Link>
          </li>
        ))}
      </ul>
      <div className="h-2 rounded-b-md border-2 border-t-0 border-cola/70 bg-cola" aria-hidden />
    </nav>
  );
}
