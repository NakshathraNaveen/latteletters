"use client";

/**
 * "or search for a cafe by name instead", under the big drink/vibe search on
 * the home page. Suggests cafes as you type (same forgiving search as /find)
 * and goes straight to the picked cafe's menu. Enter without picking one, or
 * no JS, opens the full list at /find?q=….
 */
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { FoundCafe } from "@/lib/cafes";

const SHOWN = 6;

export function CafeNameSearch() {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [cafes, setCafes] = useState<FoundCafe[]>([]);
  const [forQuery, setForQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = q.trim();

  useEffect(() => {
    if (query.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/cafes/find?${new URLSearchParams({ q: query })}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const json = (await res.json()) as { cafes: FoundCafe[] };
        setCafes(json.cafes.slice(0, SHOWN));
        setForQuery(query);
        setActive(-1);
      } catch {
        /* aborted or offline: Enter still opens /find */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const ready = open && query.length >= 2 && forQuery === query;
  const shown = ready ? cafes : [];
  const go = (c: FoundCafe) => {
    setOpen(false);
    router.push(`/cafe/${c.id}#menu`);
  };

  return (
    <form
      action="/find"
      method="get"
      role="search"
      className="w-full max-w-2xl"
      onSubmit={(e) => {
        if (active >= 0 && shown[active]) {
          e.preventDefault();
          go(shown[active]);
        }
      }}
    >
      <label htmlFor="cafe-name" className="font-hand text-2xl">
        or search for a cafe by name instead
      </label>
      <div className="relative mt-2">
        <div className="flex items-center gap-2 rounded-full border-[3px] border-dashed border-cola bg-lemon p-1.5 pl-4 shadow-[4px_4px_0_var(--color-cola)]">
          <span aria-hidden className="shrink-0 text-xl">
            ☕
          </span>
          <input
            id="cafe-name"
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
              if (e.key === "Escape") return setOpen(false);
              if (!shown.length) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => (i + 1) % shown.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => (i <= 0 ? shown.length - 1 : i - 1));
              }
            }}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={ready}
            aria-controls={listId}
            aria-activedescendant={active >= 0 && shown[active] ? `${listId}-${active}` : undefined}
            autoComplete="off"
            maxLength={80}
            placeholder="pilot coffee, chatime, la la bakeshop…"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-base text-cola placeholder:text-cola/55 focus:outline-none sm:text-lg"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full border-2 border-cola bg-hotpink px-4 py-1.5 font-display text-sm text-cola transition hover:bg-cola hover:text-cotton sm:text-base"
          >
            {loading ? "looking…" : "find it"}
          </button>
        </div>

        <div
          className={`absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border-[3px] border-cola bg-lemon shadow-[5px_6px_0_var(--color-cola)] ${ready ? "" : "hidden"}`}
          onMouseDown={() => blurTimer.current && clearTimeout(blurTimer.current)}
        >
          {shown.length > 0 ? (
            <>
              <p className="border-b-2 border-dashed border-cola/30 px-4 pb-1.5 pt-2.5 font-label text-[11px] uppercase tracking-wider text-cola/80">
                tap a cafe to see its menu
              </p>
              <ul id={listId} role="listbox" aria-label="Cafes matching that name">
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
                not here? add the city (&ldquo;{query.length > 20 ? `${query.slice(0, 20)}…` : query} toronto&rdquo;) or press enter for more
              </p>
            </>
          ) : (
            <p id={listId} role="listbox" aria-label="Cafes matching that name" className="px-4 py-3 text-sm">
              no cafes called &ldquo;{query}&rdquo; yet. Try adding the city, or{" "}
              <a href={`/add-cafe?name=${encodeURIComponent(query)}`} className="font-semibold underline">
                add it yourself
              </a>
              .
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
