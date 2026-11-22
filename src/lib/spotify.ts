/**
 * Spotify links without the Spotify API: we only use public share links,
 * Spotify's oEmbed endpoint (no key) to check a link is real and get its
 * title, and the official embed player.
 */

export type SpotifyKind = "track" | "album" | "playlist";
export type SpotifyRef = { kind: SpotifyKind; id: string };

const ID = "[A-Za-z0-9]{22}";
const URL_RE = new RegExp(`^https?://open\\.spotify\\.com/(?:intl-[a-z]{2}(?:-[a-z]{2})?/)?(?:embed/)?(track|album|playlist)/(${ID})(?:[/?#].*)?$`, "i");
const URI_RE = new RegExp(`^spotify:(track|album|playlist):(${ID})$`);
const STORED_RE = new RegExp(`^(track|album|playlist):(${ID})$`);

/** "https://open.spotify.com/track/…?si=…" or "spotify:track:…" → { kind, id } */
export function parseSpotifyLink(raw: string): SpotifyRef | null {
  const s = raw.trim();
  const m = s.match(URL_RE) ?? s.match(URI_RE);
  return m ? { kind: m[1].toLowerCase() as SpotifyKind, id: m[2] } : null;
}

/** Our stored form, e.g. "track:4cOdK2wGLETKBW3PvgPWqT". */
export const encodeSpotify = (r: SpotifyRef) => `${r.kind}:${r.id}`;

export function decodeSpotify(stored: string | null | undefined): SpotifyRef | null {
  const m = stored?.match(STORED_RE);
  return m ? { kind: m[1] as SpotifyKind, id: m[2] } : null;
}

export const spotifyPage = (r: SpotifyRef) => `https://open.spotify.com/${r.kind}/${r.id}`;
export const spotifyEmbed = (r: SpotifyRef) => `https://open.spotify.com/embed/${r.kind}/${r.id}?utm_source=generator&theme=0`;

/** Ask Spotify whether the link exists; returns its title, or null if it doesn't. */
export async function spotifyTitle(r: SpotifyRef): Promise<string | null> {
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyPage(r))}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: unknown };
    return typeof data.title === "string" && data.title.trim() ? data.title.trim().slice(0, 200) : null;
  } catch {
    return null;
  }
}

/** A mood's playlist in stored form, or null if none has been added yet. */
export function moodPlaylist(links: Record<string, string>, vibe: string): string | null {
  const r = links[vibe] ? parseSpotifyLink(links[vibe]) : null;
  return r ? encodeSpotify(r) : null;
}
