"use client";

/**
 * Social block (FR-10). Links open in a new tab and report a click-through
 * to /api/track via sendBeacon (non-blocking, survives the tab switch).
 */
import type { Social } from "@/lib/types";

const ICONS: Record<Social["platform"], string> = {
  instagram: "📷",
  tiktok: "🎵",
  facebook: "👍",
  website: "🌐",
};

function track(cafeId: string, platform: string) {
  const body = JSON.stringify({ event: "social_click", cafeId, platform });
  if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
}

export function SocialLinks({ cafeId, socials }: { cafeId: string; socials: Social[] }) {
  return (
    <ul className="flex flex-wrap gap-3">
      {socials.map((s) => (
        <li key={s.platform + s.handle}>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={() => track(cafeId, s.platform)}
            className="wiggle flex items-center gap-2 rounded-2xl border-2 border-cola bg-lemon px-4 py-2 shadow-[3px_3px_0_var(--color-cola)] transition-colors hover:bg-hotpink"
          >
            <span aria-hidden className="text-lg">
              {ICONS[s.platform]}
            </span>
            <span>
              <span className="block font-label text-[10px] uppercase tracking-widest opacity-70">{s.platform}</span>
              <span className="block max-w-[14rem] truncate font-semibold">{s.handle}</span>
            </span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
