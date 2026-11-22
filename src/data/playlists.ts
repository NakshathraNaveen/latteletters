import type { VibeId } from "@/lib/vibes";

/**
 * One Spotify playlist per mood. Paste a share link (Spotify → ⋯ → Share →
 * Copy link to playlist) between the quotes. The playlist must be public.
 * Leave a mood empty ("") and its player simply doesn't show.
 */
export const MOOD_PLAYLISTS: Record<VibeId, string> = {
  cozy: "",
  study: "",
  date: "",
  aesthetic: "",
  quiet: "",
  "late-night": "",
  patio: "",
  plants: "",
  vegan: "",
  dessert: "",
};
