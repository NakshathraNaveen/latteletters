/**
 * Cup avatars: a cup style + the drink inside + cup colour + a painted pattern.
 * Stored in profiles.avatar as "cup:<style>.<drink>.<colour>.<pattern>" (≤40 chars).
 * Older avatars were a plain drink id; those still render via DrinkCup.
 */

export const CUP_STYLES = {
  mug: { name: "Mug" },
  teacup: { name: "Teacup" },
  kulhad: { name: "Kulhad (clay chai cup)" },
  glass: { name: "Cutting chai glass" },
  togo: { name: "Takeaway cup" },
  iced: { name: "Iced cup" },
} as const;

export type Topping = "heart" | "foam" | "spice" | "none";

export const CUP_DRINKS = {
  masala: { name: "Masala chai", tint: "#c27d45", topping: "spice" },
  karak: { name: "Karak chai", tint: "#a8652f", topping: "spice" },
  kashmiri: { name: "Kashmiri pink chai", tint: "#eaa6b8", topping: "spice" },
  chailatte: { name: "Chai latte", tint: "#c8935f", topping: "heart" },
  dirtychai: { name: "Dirty chai", tint: "#9c6238", topping: "foam" },
  latte: { name: "Latte", tint: "#c99a6b", topping: "heart" },
  matcha: { name: "Matcha", tint: "#9cbf5a", topping: "heart" },
  hojicha: { name: "Hojicha", tint: "#a0704a", topping: "heart" },
  strawb: { name: "Strawberry milk", tint: "#f4a3bb", topping: "foam" },
  ube: { name: "Ube latte", tint: "#9b7bd1", topping: "heart" },
  lavender: { name: "Lavender latte", tint: "#c3b4ec", topping: "heart" },
  pistachio: { name: "Pistachio latte", tint: "#b9c98a", topping: "heart" },
  coldbrew: { name: "Cold brew", tint: "#5a3420", topping: "none" },
  cocoa: { name: "Hot chocolate", tint: "#6e3b24", topping: "foam" },
  londonfog: { name: "London fog", tint: "#cbb39a", topping: "foam" },
  boba: { name: "Brown sugar boba", tint: "#d9b38c", topping: "none" },
} as const satisfies Record<string, { name: string; tint: string; topping: Topping }>;

/** body = cup colour, ink = the colour its pattern is painted in */
export const CUP_COLOURS = {
  cream: { name: "Cream", body: "#fffde9", ink: "#f08cb8" },
  pink: { name: "Cotton candy", body: "#ffd7e7", ink: "#e0528f" },
  hotpink: { name: "Hot pink", body: "#f08cb8", ink: "#fffde9" },
  peach: { name: "Peach", body: "#ffc4a3", ink: "#c2543a" },
  butter: { name: "Butter", body: "#ffe78f", ink: "#d9822b" },
  lime: { name: "Lime", body: "#d4f31e", ink: "#47131c" },
  mint: { name: "Mint", body: "#bfead3", ink: "#2f8a62" },
  sky: { name: "Sky", body: "#bcdcf7", ink: "#3d6fb0" },
  lavender: { name: "Lavender", body: "#b9a9e8", ink: "#fffde9" },
  cherry: { name: "Cherry", body: "#d63a5a", ink: "#ffd7e7" },
  cola: { name: "Cherry cola", body: "#47131c", ink: "#f08cb8" },
} as const;

export const CUP_PATTERNS = {
  plain: { name: "Plain" },
  dots: { name: "Polka dots" },
  stripes: { name: "Stripes" },
  hearts: { name: "Hearts" },
  stars: { name: "Stars" },
  flowers: { name: "Flowers" },
  gingham: { name: "Gingham" },
  cherries: { name: "Cherries" },
  waves: { name: "Waves" },
} as const;

export type CupStyle = keyof typeof CUP_STYLES;
export type CupDrink = keyof typeof CUP_DRINKS;
export type CupColour = keyof typeof CUP_COLOURS;
export type CupPattern = keyof typeof CUP_PATTERNS;
export type Cup = { style: CupStyle; drink: CupDrink; colour: CupColour; pattern: CupPattern };

export const keys = <T extends object>(o: T) => Object.keys(o) as (keyof T)[];

export const DEFAULT_CUP: Cup = { style: "kulhad", drink: "masala", colour: "pink", pattern: "hearts" };

export const encodeCup = (c: Cup) => `cup:${c.style}.${c.drink}.${c.colour}.${c.pattern}`;

export function parseCup(avatar: string): Cup | null {
  const m = /^cup:([a-z]+)\.([a-z]+)\.([a-z]+)\.([a-z]+)$/.exec(avatar);
  if (!m) return null;
  const [, style, drink, colour, pattern] = m;
  if (!(style in CUP_STYLES) || !(drink in CUP_DRINKS) || !(colour in CUP_COLOURS) || !(pattern in CUP_PATTERNS)) return null;
  return { style, drink, colour, pattern } as Cup;
}

export function describeCup(c: Cup) {
  const pattern = c.pattern === "plain" ? "" : ` with ${CUP_PATTERNS[c.pattern].name.toLowerCase()}`;
  const cup = `${CUP_COLOURS[c.colour].name.toLowerCase()} ${CUP_STYLES[c.style].name.split(" (")[0].toLowerCase()}`;
  return `${CUP_DRINKS[c.drink].name} in a ${cup}${pattern}`;
}

export function randomCup(): Cup {
  const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
  return { style: pick(keys(CUP_STYLES)), drink: pick(keys(CUP_DRINKS)), colour: pick(keys(CUP_COLOURS)), pattern: pick(keys(CUP_PATTERNS)) };
}
