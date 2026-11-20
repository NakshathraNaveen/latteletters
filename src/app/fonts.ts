/**
 * latteletters type system.
 *
 * Custom fonts live in src/fonts (see the licence notes in each folder and
 * the README before deploying publicly). Single-weight display fonts are
 * declared with a "100 900" weight range so the browser never fakes a bold
 * version of them; `font-synthesis: none` in globals.css also prevents fake
 * italics.
 */
import localFont from "next/font/local";
import { Bricolage_Grotesque, DM_Sans, Silkscreen, Special_Elite } from "next/font/google";

/* ───────── custom (user-supplied) ───────── */

/** Chunky, bubbly display — headings, buttons, stickers */
export const cheesel = localFont({
  src: "../fonts/cheesel/cheesel.otf",
  variable: "--font-cheesel",
  weight: "100 900",
  display: "swap",
});

/** Elegant script — the "cool girl monologue" accents */
export const aston = localFont({
  src: "../fonts/aston/aston-script.ttf",
  variable: "--font-aston",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

/** Bouncy handwriting — annotations, notes, captions */
export const railey = localFont({
  src: "../fonts/railey/railey.ttf",
  variable: "--font-railey",
  weight: "100 900",
  display: "swap",
});

/** Everyday handwriting — the handwritten notes (love notes, folder notes) */
export const dailyHandwritten = localFont({
  src: "../fonts/daily-handwritten/daily-handwritten.otf",
  variable: "--font-dailyhand",
  weight: "100 900",
  display: "swap",
});

/** Clean all-caps geometric — labels, tabs, nav */
export const lemonMilk = localFont({
  src: [
    { path: "../fonts/lemon-milk/LEMONMILK-Regular.otf", weight: "400", style: "normal" },
    { path: "../fonts/lemon-milk/LEMONMILK-Medium.otf", weight: "500", style: "normal" },
    { path: "../fonts/lemon-milk/LEMONMILK-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-lemonmilk",
  display: "swap",
});

/** Retro roller-disco display — marquee ribbon & the big thank-you */
export const rollergirls = localFont({
  src: "../fonts/rollergirls/rollergirls.ttf",
  variable: "--font-rollergirls",
  weight: "100 900",
  display: "swap",
});

/* ───────── open-source supporting cast ───────── */

/** Inked vintage typewriter — receipt, ID-card details */
export const specialElite = Special_Elite({
  variable: "--font-specialelite",
  subsets: ["latin"],
  weight: "400",
});

/** Pixel type for "meet the" (creator inspo) */
export const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: ["400", "700"],
});

/** Readable body text — decorative fonts stay out of paragraphs */
export const dmSans = DM_Sans({
  variable: "--font-dmsans",
  subsets: ["latin"],
});

/** Fallback for any glyph the display font is missing (e.g. curly quotes) */
export const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const fontVariables = [cheesel, aston, railey, dailyHandwritten, lemonMilk, rollergirls, specialElite, silkscreen, dmSans, bricolage]
  .map((f) => f.variable)
  .join(" ");
