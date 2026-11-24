/** Kinds of spot someone can pick when adding a cafe (shared by the form and the server). */
export const CAFE_KINDS = [
  { value: "coffee", label: "coffee", emoji: "☕" },
  { value: "tea", label: "tea / matcha", emoji: "🍵" },
  { value: "bubble_tea", label: "boba", emoji: "🧋" },
  { value: "bakery", label: "bakery cafe", emoji: "🥐" },
  { value: "dessert", label: "dessert cafe", emoji: "🍨" },
] as const;

export type CafeKind = (typeof CAFE_KINDS)[number]["value"];
