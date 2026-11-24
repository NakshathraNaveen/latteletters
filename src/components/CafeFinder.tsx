"use client";

/**
 * "Find the cafe you went to": type its name, pick it, write the review.
 * Results come as you type (debounced). Without JS the form still submits to
 * /find?q=…, which renders the same list on the server.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FoundCafe } from "@/lib/cafes";

export function CafeFinder({ initialQuery = "", initial }: { initialQuery?: string; initial?: { cafes: FoundCafe[]; mapFailed: boolean } }) {
  const [q, setQ] = useState(initialQuery);
  const [result, setResult] = useState(initial ?? null);
  const [loading, setLoading] = useState(false);
  const [near, setNear] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const lastFetched = useRef(initial ? `${initialQuery}|` : "");

  useEffect(() => {
    const query = q.trim();
    const key = `${query}|${near ? `${near.lat},${near.lng}` : ""}`;
    if (key === lastFetched.current || query.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (near) {
          params.set("lat", near.lat.toFixed(2));
          params.set("lng", near.lng.toFixed(2));
        }
        const res = await fetch(`/api/cafes/find?${params}`, { signal: ctrl.signal });
        if (res.ok) {
          setResult(await res.json());
          lastFetched.current = key;
        }
      } catch {
        /* aborted or offline: keep the last results */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, near]);

  function preferNearby() {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setNear({ lat: Math.round(coords.latitude * 100) / 100, lng: Math.round(coords.longitude * 100) / 100 });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  const query = q.trim();
  const addHref = `/add-cafe${query ? `?name=${encodeURIComponent(query)}` : ""}`;

  return (
    <div>
      <form action="/find" method="get" role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="find-cafe" className="font-hand text-2xl">
          which cafe did you go to?
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-full border-[3px] border-cola bg-lemon p-1.5 pl-5 shadow-[4px_4px_0_var(--color-cola)]">
          <input
            id="find-cafe"
            name="q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
            autoFocus
            maxLength={80}
            placeholder="pilot coffee toronto, chatime, that tiny matcha place…"
            className="min-w-0 flex-1 bg-transparent py-2 text-base text-cola placeholder:text-cola/55 focus:outline-none sm:text-lg"
          />
          <noscript>
            <button type="submit" className="rounded-full border-2 border-cola bg-hotpink px-4 py-1.5 font-display">
              find
            </button>
          </noscript>
        </div>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="text-cola/75">tip: add the city or street if it&apos;s a common name</span>
        <button
          type="button"
          onClick={preferNearby}
          disabled={locating || !!near}
          className="font-semibold underline underline-offset-4 disabled:no-underline disabled:opacity-70"
        >
          {near ? "📍 showing cafes near you first" : locating ? "finding you…" : "📍 show ones near me first"}
        </button>
      </div>

      <div aria-live="polite" className="mt-8">
        {loading && !result && <p className="font-hand text-2xl">flipping through the map…</p>}
        {result && query.length >= 2 && <FoundList cafes={result.cafes} mapFailed={result.mapFailed} query={query} addHref={addHref} dim={loading} />}
      </div>
    </div>
  );
}

export function FoundList({ cafes, mapFailed, query, addHref, dim = false }: { cafes: FoundCafe[]; mapFailed: boolean; query: string; addHref: string; dim?: boolean }) {
  return (
    <div className={dim ? "opacity-60 transition-opacity" : "transition-opacity"}>
      {cafes.length > 0 ? (
        <>
          <p className="sr-only">
            {cafes.length} {cafes.length === 1 ? "cafe" : "cafes"} found
          </p>
          <ul className="space-y-3">
            {cafes.map((c, i) => (
              <li key={c.id}>
                <Link
                  href={`/cafe/${c.id}#love-notes`}
                  className="paper group flex items-center gap-4 rounded-2xl border-2 border-cola bg-lemon px-5 py-3 shadow-[3px_3px_0_var(--color-cola)] transition hover:-translate-y-0.5 hover:bg-cotton-deep"
                  style={{ rotate: `${[-0.6, 0.4, -0.2, 0.7][i % 4]}deg` }}
                >
                  <span aria-hidden className="text-2xl">
                    {c.community ? "✦" : "☕"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-xl">{c.name}</span>
                    <span className="block truncate text-sm text-cola/80">
                      {c.place || "address not listed"} · <i>{c.kind}</i>
                    </span>
                  </span>
                  <span className="hidden shrink-0 font-hand text-xl group-hover:underline sm:inline">review it →</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="font-hand text-2xl">
          {mapFailed ? "the map search is a little busy right now. Try again in a few seconds." : <>no cafes called &ldquo;{query}&rdquo; on the map yet.</>}
        </p>
      )}

      <div className="mt-8 rounded-2xl border-2 border-dashed border-cola/60 bg-cotton-deep/60 p-5">
        <p className="font-display text-xl">{cafes.length ? "not in the list?" : "add it yourself ✦"}</p>
        <p className="mt-1 text-sm">Small and brand-new spots aren&apos;t always on the map. Add it in under a minute, then write your review.</p>
        <Link
          href={addHref}
          className="mt-3 inline-flex rounded-full border-2 border-cola bg-hotpink px-5 py-2 font-display shadow-[3px_3px_0_var(--color-cola)] transition hover:-translate-y-0.5 hover:bg-cola hover:text-cotton"
        >
          + add {query ? <>&ldquo;{query.length > 28 ? `${query.slice(0, 28)}…` : query}&rdquo;</> : "a cafe"}
        </Link>
      </div>
    </div>
  );
}
