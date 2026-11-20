"use client";

/**
 * "📍 near me": asks the browser for the visitor's location, rounds it to
 * ~110 m, and searches around it. The exact position never leaves the
 * browser, and nothing is stored.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";

export function NearMeButton({ className = "", radius }: { className?: string; radius?: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "locating" | "denied" | "unsupported">("idle");

  function locate(e: React.MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.closest("form");
    const q = (form?.elements.namedItem("q") as HTMLInputElement | null)?.value ?? "";
    if (!("geolocation" in navigator)) return setState("unsupported");
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const p = new URLSearchParams();
        if (q.trim()) p.set("q", q.trim());
        p.set("lat", coords.latitude.toFixed(3));
        p.set("lng", coords.longitude.toFixed(3));
        if (radius) p.set("r", radius);
        setState("idle");
        router.push(`/search?${p}`);
      },
      () => setState("denied"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={locate}
        disabled={state === "locating"}
        className={`inline-flex items-center gap-1.5 rounded-full border-2 border-cola bg-lemon px-4 py-2 font-label text-xs uppercase tracking-wider shadow-[2px_3px_0_var(--color-cola)] transition hover:-translate-y-0.5 hover:bg-lime disabled:opacity-60 ${className}`}
      >
        <span aria-hidden>📍</span> {state === "locating" ? "finding you…" : "near me"}
      </button>
      <span role="status" className="mt-1 font-hand text-lg leading-tight">
        {state === "denied" && "location is off — type a city instead!"}
        {state === "unsupported" && "your browser can't share location — type a city!"}
      </span>
    </span>
  );
}
