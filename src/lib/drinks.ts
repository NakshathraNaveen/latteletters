/**
 * Drink alias dictionary (PRD FR-2).
 *
 * Each canonical drink has a display name and a list of aliases: alternate
 * names, viral nicknames and common misspellings. Search resolves whatever
 * the user types to one or more canonical drink ids.
 */

export type DrinkId =
  | "latte"
  | "iced-latte"
  | "matcha-latte"
  | "strawberry-matcha"
  | "hojicha-latte"
  | "dirty-chai"
  | "chai-latte"
  | "london-fog"
  | "cold-brew"
  | "dalgona"
  | "pistachio-latte"
  | "brown-sugar-shaken-espresso"
  | "espresso-tonic"
  | "spanish-latte"
  | "lavender-latte"
  | "rose-latte"
  | "ube-latte"
  | "cloud-coffee"
  | "cortado"
  | "flat-white"
  | "cappuccino"
  | "americano"
  | "mocha"
  | "affogato"
  | "pour-over"
  | "bubble-tea";

export type DrinkInfo = {
  name: string;
  aliases: string[];
  /** colour of the drink, used by the illustrated cup */
  tint: string;
  iced?: boolean;
};

export const DRINKS: Record<DrinkId, DrinkInfo> = {
  latte: {
    name: "Latte",
    aliases: ["latte", "cafe latte", "caffe latte", "oat latte", "late", "lattee"],
    tint: "#c99a6b",
  },
  "iced-latte": {
    name: "Iced latte",
    aliases: ["iced latte", "ice latte", "iced coffee latte", "iced lattee"],
    tint: "#d2a679",
    iced: true,
  },
  "matcha-latte": {
    name: "Matcha latte",
    aliases: ["matcha", "matcha latte", "macha", "mattcha", "matcha tea latte", "green tea latte", "iced matcha"],
    tint: "#9cbf5a",
    iced: true,
  },
  "strawberry-matcha": {
    name: "Strawberry matcha",
    aliases: ["strawberry matcha", "strawberry matcha latte", "strawberry macha"],
    tint: "#e98aa6",
    iced: true,
  },
  "hojicha-latte": {
    name: "Hojicha latte",
    aliases: ["hojicha", "hojicha latte", "houjicha", "roasted green tea latte"],
    tint: "#a0704a",
  },
  "dirty-chai": {
    name: "Dirty chai",
    aliases: ["dirty chai", "dirty chai latte", "chai with espresso", "dirty chi", "dirtychai"],
    tint: "#b7804f",
  },
  "chai-latte": {
    name: "Chai latte",
    aliases: ["chai", "chai latte", "chai tea latte", "masala chai", "chai tea"],
    tint: "#c8935f",
  },
  "london-fog": {
    name: "London fog",
    aliases: ["london fog", "earl grey latte", "fog latte", "londonfog"],
    tint: "#cbb39a",
  },
  "cold-brew": {
    name: "Cold brew",
    aliases: ["cold brew", "coldbrew", "cold brew coffee", "cold coffee"],
    tint: "#5a3420",
    iced: true,
  },
  dalgona: {
    name: "Dalgona coffee",
    aliases: ["dalgona", "dalgona coffee", "whipped coffee", "dalgona latte", "whipped latte"],
    tint: "#d9a35c",
    iced: true,
  },
  "pistachio-latte": {
    name: "Iced pistachio latte",
    aliases: ["pistachio latte", "iced pistachio latte", "pistachio", "pistacio latte", "pistachio cream"],
    tint: "#b9c98a",
    iced: true,
  },
  "brown-sugar-shaken-espresso": {
    name: "Brown sugar shaken espresso",
    aliases: [
      "brown sugar shaken espresso",
      "iced brown sugar oat shaken espresso",
      "brown sugar oat",
      "shaken espresso",
      "brown sugar latte",
    ],
    tint: "#a86a3c",
    iced: true,
  },
  "espresso-tonic": {
    name: "Espresso tonic",
    aliases: ["espresso tonic", "coffee tonic", "tonic espresso"],
    tint: "#8c5a3a",
    iced: true,
  },
  "spanish-latte": {
    name: "Spanish latte",
    aliases: ["spanish latte", "condensed milk latte", "cafe con leche"],
    tint: "#d6ad7e",
  },
  "lavender-latte": {
    name: "Lavender latte",
    aliases: ["lavender latte", "honey lavender latte", "lavender", "lavendar latte"],
    tint: "#b9a9e8",
  },
  "rose-latte": {
    name: "Rose latte",
    aliases: ["rose latte", "rose", "rosewater latte"],
    tint: "#f2a8c4",
  },
  "ube-latte": {
    name: "Ube latte",
    aliases: ["ube", "ube latte", "purple yam latte"],
    tint: "#9b7bd1",
    iced: true,
  },
  "cloud-coffee": {
    name: "Cloud coffee",
    aliases: ["cloud coffee", "cloud latte", "cloud macchiato"],
    tint: "#e7c9a5",
    iced: true,
  },
  cortado: {
    name: "Cortado",
    aliases: ["cortado", "gibraltar", "cortadito"],
    tint: "#a26b45",
  },
  "flat-white": {
    name: "Flat white",
    aliases: ["flat white", "flatwhite"],
    tint: "#c4925f",
  },
  cappuccino: {
    name: "Cappuccino",
    aliases: ["cappuccino", "capuccino", "cappucino", "cappuchino", "cap"],
    tint: "#c08a58",
  },
  americano: {
    name: "Americano",
    aliases: ["americano", "long black", "iced americano"],
    tint: "#4a2a1a",
  },
  mocha: {
    name: "Mocha",
    aliases: ["mocha", "iced mocha", "cafe mocha", "chocolate latte", "moca"],
    tint: "#6e3f28",
  },
  affogato: {
    name: "Affogato",
    aliases: ["affogato", "afogato", "espresso ice cream"],
    tint: "#f4e3c8",
  },
  "pour-over": {
    name: "Pour over",
    aliases: ["pour over", "pourover", "filter coffee", "drip coffee", "v60", "chemex"],
    tint: "#3e2416",
  },
  "bubble-tea": {
    name: "Bubble tea",
    aliases: ["bubble tea", "boba", "boba tea", "milk tea", "pearl milk tea", "tapioca tea", "bubbletea"],
    tint: "#c9a27e",
    iced: true,
  },
};

/**
 * What kind of cafe makes each drink. OpenStreetMap has no menus, so drink
 * search matches on cafe type (cuisine tags) and on the cafe's name.
 */
export type DrinkFamily = "coffee" | "tea" | "boba" | "sweet";

export const DRINK_FAMILY: Record<DrinkId, DrinkFamily> = {
  latte: "coffee",
  "iced-latte": "coffee",
  "matcha-latte": "tea",
  "strawberry-matcha": "tea",
  "hojicha-latte": "tea",
  "dirty-chai": "coffee",
  "chai-latte": "tea",
  "london-fog": "tea",
  "cold-brew": "coffee",
  dalgona: "coffee",
  "pistachio-latte": "coffee",
  "brown-sugar-shaken-espresso": "coffee",
  "espresso-tonic": "coffee",
  "spanish-latte": "coffee",
  "lavender-latte": "coffee",
  "rose-latte": "coffee",
  "ube-latte": "coffee",
  "cloud-coffee": "coffee",
  cortado: "coffee",
  "flat-white": "coffee",
  cappuccino: "coffee",
  americano: "coffee",
  mocha: "coffee",
  affogato: "sweet",
  "pour-over": "coffee",
  "bubble-tea": "boba",
};

/** Words that, if they appear in a cafe's name, strongly suggest it makes the drink. */
export const DRINK_NAME_WORDS: Partial<Record<DrinkId, string[]>> = {
  "matcha-latte": ["matcha", "maccha"],
  "strawberry-matcha": ["matcha"],
  "hojicha-latte": ["hojicha", "matcha"],
  "dirty-chai": ["chai"],
  "chai-latte": ["chai"],
  "pistachio-latte": ["pistachio"],
  "ube-latte": ["ube"],
  affogato: ["gelato", "gelateria", "affogato"],
  "pour-over": ["roast", "roaster", "roasters", "roastery", "brew"],
  "cold-brew": ["brew", "roasters"],
  "espresso-tonic": ["espresso"],
  "bubble-tea": ["boba", "bubble", "tea", "chatime", "gong cha", "coco", "sharetea", "kung fu tea"],
};

export const DRINK_IDS = Object.keys(DRINKS) as DrinkId[];

/** Drinks shown as quick-pick chips under the search bar (FR-4). */
export const DRINK_CHIPS: DrinkId[] = ["iced-latte", "matcha-latte", "cold-brew", "dirty-chai", "bubble-tea", "pistachio-latte"];
