/**
 * The three polaroids in the "how it works" section on the home page.
 *
 * To use your own picture for a step:
 *   1. Put the image in the /public folder (e.g. public/how-1.jpg).
 *   2. Set `image` below to "/how-1.jpg" (a slash + the exact filename).
 *   3. Describe the picture in `alt` (read aloud by screen readers).
 *
 * Square-ish images look best. `focus` ("x% y%") picks which part of the
 * picture stays in frame if it gets cropped. Leave `image` as null to keep
 * the illustrated version.
 */
export const HOW_IT_WORKS = [
  {
    caption: "tell us your craving",
    image: "/coffeeimage.jpg" as string | null,
    alt: "An IV drip bag filled with coffee",
    focus: "50% 38%",
  },
  {
    caption: "or pick a vibe",
    image: "/the-vibe.jpg" as string | null,
    alt: "Iced coffee in a floral teacup beside a pink lily",
    focus: "55% 50%",
  },
  {
    caption: "go say hi (and tag them!)",
    image: "/sayhi.jpg" as string | null,
    alt: "Framed coffee-ring art reading 'How do you like your coffee?' 'With you.'",
    focus: "50% 50%",
  },
];
