"use client";

/**
 * The "what" box of the big search bar. Still a plain `q` field, so drinks,
 * vibes and "matcha in tokyo" search as before, but as you type it also
 * suggests cafes by name (same forgiving search as /find). Picking one goes
 * straight to that cafe's menu.
 */
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { FoundCafe } from "@/lib/cafes";

const SHOWN = 5;

export function HeroQueryInput({ defaultQuery = "", coords }: { defaultQuery?: string; coords?: { lat: string; lng: string } }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState(defaultQuery);
  const [cafes, setCafes] = useState<FoundCafe[]>([]);
  const [forQuery, setForQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = q.trim();
  const lat = coords?.lat;
  const lng = coords?.lng;

  useEffect(() => {
    if (query.length < 3) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query });
        if (lat && lng) {
          params.set("lat", lat);
          params.set("lng", lng);
        }
        const res = await fetch(`/api/cafes/find?${params}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const json = (await res.json()) as { cafes: FoundCafe[] };
        setCafes(json.cafes.slice(0, SHOWN));
        setForQuery(query);
        setActive(-1);
      } catch {
        /* aborted or offline: no suggestions, the normal search still works */
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, lat, lng]);

  const shown = open && query.length >= 3 && forQuery === query ? cafes : [];
  const go = (c: FoundCafe) => {
    setOpen(false);
    router.push(`/cafe/${c.id}#menu`);
  };

  return (
    <>
      <input
        id="search-q"
        name="q"
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={(e) => {
          if (!shown.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => (i + 1) % shown.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (i <= 0 ? shown.length - 1 : i - 1));
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            go(shown[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shown.length > 0}
        aria-controls={listId}
        aria-activedescendant={active >= 0 && shown[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        maxLength={80}
        placeholder="dirty chai, cozy study spot, a cafe's name…"
        className="min-w-0 flex-1 bg-transparent py-2 text-lg text-cola placeholder:text-cola/55 focus:outline-none"
      />
      <div
        className={`absolute inset-x-2 top-full z-40 mt-2 overflow-hidden rounded-2xl border-[3px] border-cola bg-lemon text-left shadow-[5px_6px_0_var(--color-cola)] ${
          shown.length ? "" : "hidden"
        }`}
        onMouseDown={() => blurTimer.current && clearTimeout(blurTimer.current)}
      >
        <p className="border-b-2 border-dashed border-cola/30 px-4 pb-1.5 pt-2.5 font-label text-[11px] uppercase tracking-wider text-cola/80">
          cafes called that · tap one for its menu
        </p>
        <ul id={listId} role="listbox" aria-label="Cafes matching your search">
          {shown.map((c, i) => (
            <li
              key={c.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(c)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 ${i === active ? "bg-cotton-deep" : ""}`}
            >
              <span aria-hidden className="text-xl">
                {c.community ? "✦" : "☕"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-lg leading-tight">{c.name}</span>
                <span className="block truncate text-sm text-cola/75">{c.place || c.kind}</span>
              </span>
              <span aria-hidden className="hidden shrink-0 font-hand text-lg sm:inline">
                menu →
              </span>
            </li>
          ))}
        </ul>
        <p className="border-t-2 border-dashed border-cola/30 px-4 py-2 text-sm text-cola/80">
          or press <kbd className="font-semibold">enter</kbd> to search drinks &amp; vibes for &ldquo;{query}&rdquo;
        </p>
      </div>
    </>
  );
}
