import { blobImage } from "./images";

/**
 * Everything on the "meet the creator" page lives here, so it's easy to edit.
 *
 * TODO(naksh): fill in the blanks marked null. Anything left null shows as a
 * fill-in-the-blank line on the page, so nothing is ever made up.
 */

export const CREATOR = {
  name: "Nakshathra Nambiar",
  nickname: "naksh",
  /** e.g. "@naksh.codes" — null hides it */
  handle: null as string | null,
  /** main polaroid photo (in Vercel Blob, see images.ts); `focus` = where your face is, as "x% y%" */
  photo: blobImage("creatorimage1.png") as string | null,
  photoFocus: "45% 52%",
  /** how far to zoom in on photoFocus (1 = no zoom) */
  photoZoom: 1.25,
  /** photobooth-strip photos (in Vercel Blob); `focus` keeps your face in frame */
  photobooth: [
    { src: blobImage("photostrip1.png"), focus: "38% 40%" },
    { src: blobImage("photostrip2.jpg"), focus: "40% 34%" },
    { src: blobImage("photostrip3.png"), focus: "32% 50%" },
  ] as { src: string; focus: string }[],
  /** speech-bubble tags around the envelope */
  tags: ["designer & developer", "iced latte loyalist", "scrapbook enthusiast"],
  bio: [
    "Hi, I'm Naksh! I designed and built latteletters because finding a cafe should feel as fun as the drink itself.",
    "Every folder, sticker and lace border here was made by hand (well, by code) to feel like a page out of my scrapbook.",
  ],
  links: [] as { label: string; href: string }[],
};

/** Naksh's go-to coffee order — the receipt on the creator page. */
export const GO_TO_ORDER = {
  drink:"iced brown sugar latte with an extra espresso shot and espresso cold foam" as string | null, // e.g. "iced brown sugar oat latte"
  size: "medium" as string | null, // e.g. "large"
  milk: "plain old regular milk" as string | null, // e.g. "oat"
  sweetness: "SWEET" as string | null, // e.g. "half sweet"
  temperature: "ice cold:)" as string | null, // e.g. "iced, light ice"
  extras: "cinnamon or cookie crumbl on top" as string | null, // e.g. "extra shot, cinnamon on top"
  notes: ["pairs so good with a cream cheese bagel!!"] as string[], // e.g. ["no straw, I bring my own", "pairs with a croissant"]
};
