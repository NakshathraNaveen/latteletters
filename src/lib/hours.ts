import "server-only";
import OpeningHours from "opening_hours";
import tzlookup from "tz-lookup";
import type { Cafe } from "./types";

export type OpenState = "open" | "closed" | "unknown";

/** The cafe's local wall-clock time, as a Date whose *local* fields match it
 *  (opening_hours reads local getters; the server itself runs in UTC). */
function localNow(lat: number, lng: number, now: Date): Date | null {
  let tz: string;
  try {
    tz = tzlookup(lat, lng);
  } catch {
    return null;
  }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
}

/** Is the cafe open right now, in its own time zone? "unknown" when OSM has no (parseable) hours. */
export function openState(cafe: Pick<Cafe, "hours" | "lat" | "lng">, now = new Date()): OpenState {
  if (!cafe.hours) return "unknown";
  const at = localNow(cafe.lat, cafe.lng, now);
  if (!at) return "unknown";
  try {
    const oh = new OpeningHours(cafe.hours);
    if (oh.getUnknown(at)) return "unknown";
    return oh.getState(at) ? "open" : "closed";
  } catch {
    return "unknown";
  }
}
