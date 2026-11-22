/**
 * Everything in the "how it works" section on the home page: the letter,
 * the "this is for you if…" list, and the three polaroid steps.
 * Edit any words here; the page updates to match.
 *
 * Polaroid pictures:
 * To use your own picture for a step:
 *   1. Upload it to Vercel Blob (see src/data/images.ts).
 *   2. Set `image` below to blobImage("how-1.jpg").
 *   3. Describe the picture in `alt` (read aloud by screen readers).
 *
 * Square-ish images look best. `focus` ("x% y%") picks which part of the
 * picture stays in frame if it gets cropped. Leave `image` as null to keep
 * the illustrated version.
 */
import { blobImage } from "./images";

export const HOW_IT_WORKS = [
  {
    caption: "tell us your craving",
    image: blobImage("coffeeimage.jpg") as string | null,
    alt: "An IV drip bag filled with coffee",
    focus: "50% 38%",
    note: "type a drink, a trend or even a typo. “boba”, “dirty chai” and “capuccino” all work.",
  },
  {
    caption: "or pick a vibe",
    image: blobImage("the-vibe.jpg") as string | null,
    alt: "Iced coffee in a floral teacup beside a pink lily",
    focus: "55% 50%",
    note: "cozy, study, date, late night… we read the map clues (wifi, hours, patios) to match. then pick how far you’ll wander, sort, filter or flip to the map.",
  },
  {
    caption: "go say hi (and tag them!)",
    image: blobImage("sayhi.jpg") as string | null,
    alt: "Framed coffee-ring art reading 'How do you like your coffee?' 'With you.'",
    focus: "50% 50%",
    note: "peek at its ID card for hours and socials, ♡ save it for later, then leave a review or a love note (even the song that was playing).",
  },
];

/** The letter. Each string is a paragraph. */
export const LETTER = {
  greeting: "dear you ♡,",
  paragraphs: [
    "i built latteletters because i missed my go-tos back home. you know the ones: the cafe you don’t have to think about, where the cup just tastes like home.",
    "so this is for anyone looking for their next one. maybe you’re new to a city and don’t know where to start. maybe you’re exploring and want to try every new trend (hi, ube and pistachio lattes). or maybe you just want somewhere close by that feels a little like home. you’re in the right spot.",
    "tell it what you’re craving, pick a mood, and it finds real cafes anywhere in the world. when you find a good one, leave a love note so the next person finds it too. i’m hoping this turns into a little community of people who love drinks just as much as i do.",
  ],
  signOff: "see you at the counter,",
  signature: "naksh",
  ps: "p.s. my order is an iced brown sugar latte with an extra shot. if you try it, tell me!",
};

/** The taped checklist next to the letter. */
export const FOR_YOU_IF = [
  "you’re new in town and don’t know where to start",
  "you love trying the newest trend in a cup",
  "you want somewhere close by that feels like home",
  "you’ve ever missed your go-to cafe",
  "you love drinks as much as i do",
];
