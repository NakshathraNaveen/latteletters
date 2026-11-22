"use client";

import { useState } from "react";
import { decodeSpotify, spotifyEmbed, spotifyPage } from "@/lib/spotify";

/**
 * A little "now playing" chip. Spotify's player (and its cookies) only loads
 * once someone taps play, so pages stay fast and private by default.
 */
export function SpotifyPlayer({
  song,
  title,
  prefix = "now playing",
  compact = false,
  className = "",
}: {
  /** stored form, e.g. "track:4cOdK2wGLETKBW3PvgPWqT" */
  song: string;
  title?: string | null;
  prefix?: string;
  /** the 80px player even for playlists (for tight spots) */
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = decodeSpotify(song);
  if (!ref) return null;
  const name = title || (ref.kind === "track" ? "a song" : `a ${ref.kind}`);

  if (open) {
    return (
      <iframe
        src={spotifyEmbed(ref)}
        title={`Spotify player: ${name}`}
        height={compact || ref.kind === "track" ? 80 : 152}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className={`w-full rounded-xl border-0 ${className}`}
      />
    );
  }

  return (
    <div className={`flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border-2 border-cola bg-cotton px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_var(--color-cola)] transition hover:-translate-y-0.5 hover:bg-cotton-deep"
      >
        <span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-full bg-cola text-[10px] text-cotton">
          ▶
        </span>
        <span className="truncate">
          <span className="font-hand text-base font-normal">{prefix} ♫</span> {name}
        </span>
        <span className="sr-only"> (loads the Spotify player)</span>
      </button>
      <a href={spotifyPage(ref)} target="_blank" rel="noopener noreferrer" className="text-xs text-cola/70 underline underline-offset-2">
        open in Spotify<span className="sr-only"> (new tab)</span>
      </a>
    </div>
  );
}
