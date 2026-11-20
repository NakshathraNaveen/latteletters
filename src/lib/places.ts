/** Quick-pick cities for the "where to?" stickers. Any place in the world works in the search box. */
export const POPULAR_PLACES = [
  "Waterloo, Ontario",
  "Toronto",
  "New York",
  "London",
  "Paris",
  "Tokyo",
  "Seoul",
  "Melbourne",
  "Mumbai",
  "Mexico City",
  "Copenhagen",
  "Bangkok",
];

/** Search-distance folders. */
export const RADII = [
  { value: "1", label: "walkable", note: "1 km" },
  { value: "3", label: "short ride", note: "3 km" },
  { value: "8", label: "worth the trip", note: "8 km" },
] as const;

export const DEFAULT_RADIUS = "3";
