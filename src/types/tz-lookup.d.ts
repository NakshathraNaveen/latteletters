declare module "tz-lookup" {
  /** IANA time zone name for a coordinate, e.g. "America/Toronto". */
  export default function tzlookup(lat: number, lng: number): string;
}
