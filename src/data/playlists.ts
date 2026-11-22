import type { VibeId } from "@/lib/vibes";

/**
 * One Spotify playlist per mood. Paste a share link (Spotify → ⋯ → Share →
 * Copy link to playlist) between the quotes. The playlist must be public.
 * Leave a mood empty ("") and its player simply doesn't show.
 */
export const MOOD_PLAYLISTS: Record<VibeId, string> = {
  cozy: "https://open.spotify.com/playlist/61v9zLajqRgazElZUWb2B4",
  study: "https://open.spotify.com/playlist/37i9dQZF1EIfjzgnbx4yqL",
  date: "https://open.spotify.com/playlist/37i9dQZF1EIhMt9xBlLWCX",
  aesthetic: "https://open.spotify.com/playlist/3tVn8zUOCMV5hfT8NRyHoJ",
  quiet: "",
  "late-night": "",
  patio: "",
  plants: "",
  vegan: "",
  dessert: "",
};
