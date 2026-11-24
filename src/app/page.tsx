import Link from "next/link";
import { Chips } from "@/components/Chips";
import { DrinkCup } from "@/components/DrinkCup";
import { NearMeButton } from "@/components/NearMeButton";
import { SearchBar } from "@/components/SearchBar";
import { MetalStar, Sparkle, Sticker } from "@/components/decor";
import { HowItWorks } from "@/components/HowItWorks";
import { MoodFolders, type MoodFolder } from "@/components/MoodFolders";
import { PostCard } from "@/components/PostCards";
import { DRINKS, type DrinkId } from "@/lib/drinks";
import { recentPosts, type Post } from "@/lib/posts";
import { POPULAR_PLACES } from "@/lib/places";
import { moodPlaylist } from "@/lib/spotify";
import { MOOD_FOLDERS, VIBES } from "@/lib/vibes";
import { MOOD_PLAYLISTS } from "@/data/playlists";

const MOODS: MoodFolder[] = MOOD_FOLDERS.map((m) => ({
  ...m,
  lookFor: VIBES[m.vibe].lookFor,
  drinkName: DRINKS[m.drink].name.toLowerCase(),
  playlist: moodPlaylist(MOOD_PLAYLISTS, m.vibe),
}));

const STAMP_BG = ["bg-cotton", "bg-lavender/60", "bg-lemon", "bg-[#c5d28a]/70", "bg-hotpink/50", "bg-lime/50"];
const STAMP_DRINKS: DrinkId[] = ["iced-latte", "matcha-latte", "cappuccino", "bubble-tea", "cold-brew", "strawberry-matcha", "latte", "dirty-chai"];

const NOTES = [
  { text: "found a london fog on a rainy tuesday and it got me through midterms 🫖", who: "— a sleepy student", tone: "bg-lemon", r: -4 },
  { text: "cried a little at how cute my pistachio latte was. 10/10", who: "— matcha girlie", tone: "bg-hotpink", r: 3 },
  { text: "searched 'late night' and found a cafe open till midnight?? hero", who: "— exam season survivor", tone: "bg-lavender", r: -2 },
  { text: "took my date to a 'date' folder pick. we're getting married (jk) (unless)", who: "— hopeless romantic", tone: "bg-lime", r: 5 },
];

export default function Home() {
  return (
    <>
      {/* ─────────────────────────── HERO ─────────────────────────── */}
      <section data-fx="hero" data-scrub="hero" className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:pt-16">
          <div className="relative z-10">
            <p className="font-serif text-2xl italic">
              <span data-fx-word className="inline-block">
                a scrapbook cafe finder
              </span>{" "}
              <span data-fx-word className="inline-block">
                for anywhere
              </span>
            </p>
            <h1 className="mt-3 font-display text-[clamp(3rem,8.5vw,6.5rem)] font-extrabold leading-[0.88] tracking-tighter">
              <span className="block overflow-hidden pb-1">
                <span data-fx-word className="inline-block">
                  find your
                </span>
              </span>
              <span className="block overflow-hidden pb-1">
                <span data-fx-word className="relative inline-block">
                  <span className="text-hotpink [-webkit-text-stroke:2px_var(--color-cola)] [paint-order:stroke_fill]">cup</span>
                  {/* hand-drawn circle around "cup" */}
                  <svg aria-hidden viewBox="0 0 200 90" className="absolute -inset-x-4 -inset-y-2 h-[calc(100%+1rem)] w-[calc(100%+2rem)] overflow-visible">
                    <path
                      d="M30 60 C10 30 70 6 120 10 C175 14 196 44 178 66 C160 88 70 90 34 70 C18 60 22 44 40 34"
                      fill="none"
                      stroke="var(--color-hotpink)"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{" "}
                <span data-fx-word className="inline-block">
                  of
                </span>
              </span>
              <span className="block overflow-hidden pb-1">
                <span data-fx-word className="inline-block">
                  vibes.
                </span>
              </span>
            </h1>
            <p className="mt-5 max-w-md text-lg">
              Search by the drink you saw on TikTok or the mood you&rsquo;re in, and we&rsquo;ll find the cafe for it.
            </p>

            <div data-fx-search className="relative mt-8">
              {/* doodled annotation */}
              <p aria-hidden className="absolute -top-9 right-2 hidden rotate-[4deg] font-hand text-2xl text-cola sm:block">
                type a drink or a feeling
                <svg viewBox="0 0 60 40" className="ml-1 inline-block h-8 w-12 align-top">
                  <path d="M4 6 C30 2 46 14 44 34" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M36 28 L44 36 L50 26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </p>
              <SearchBar />
            </div>

            <Chips className="mt-6" />
            <p className="mt-5 font-hand text-2xl">
              already been somewhere?{" "}
              <Link href="/find" className="underline decoration-hotpink decoration-2 underline-offset-4 hover:text-hotpink">
                review a cafe you visited →
              </Link>
            </p>
          </div>

          {/* poster collage: echoing words behind a floating cut-out drink */}
          <div aria-hidden className="relative mx-auto aspect-[4/5] w-full max-w-[18rem] select-none max-md:overflow-x-clip sm:max-w-md">
            <div className="absolute inset-0 flex flex-col justify-center gap-0 font-display font-extrabold leading-[0.8] tracking-tighter text-hotpink">
              {["iced latte", "iced latte", "iced latte", "iced latte"].map((w, i) => (
                <span key={i} data-par-x className="block">
                  <span
                    data-fx-echo
                    className="block whitespace-nowrap text-[clamp(3.5rem,11vw,7rem)]"
                    style={{ opacity: 1 - i * 0.12, marginLeft: i % 2 ? "-1.5rem" : "0" }}
                  >
                    {w}
                  </span>
                </span>
              ))}
            </div>
            <div data-fx-cup className="absolute inset-0 grid place-items-center">
              <div data-par-cup>
                <div className="animate-float">
                  <DrinkCup drink="iced-latte" className="h-[17rem] w-auto drop-shadow-[0_24px_30px_rgb(71_19_28/0.35)] sm:h-[22rem] md:h-[26rem]" />
                </div>
              </div>
            </div>
            <div data-fx-sparkle className="absolute right-0 top-[18%]">
              <div data-par-sticker>
                <Sticker rotate={-14}>coffee</Sticker>
              </div>
            </div>
            <div data-fx-sparkle className="absolute bottom-[12%] left-0">
              <div data-par-sticker>
                <Sticker tone="lavender" rotate={8} className="font-hand text-2xl font-bold">
                  sip sip!
                </Sticker>
              </div>
            </div>
            <div data-fx-sparkle className="absolute left-[6%] top-[6%]">
              <MetalStar size={56} className="animate-twinkle" />
            </div>
            <MetalStar size={34} className="absolute bottom-[4%] right-[14%] animate-twinkle [animation-delay:1.3s]" />
            <Sparkle size={30} color="var(--color-lime)" className="absolute right-[10%] top-[4%] animate-twinkle [animation-delay:.6s]" />
            <Sparkle size={22} color="var(--color-lavender)" className="absolute bottom-[30%] right-[2%] animate-twinkle [animation-delay:1.8s]" />
          </div>
        </div>
      </section>

      {/* ─────────────────────────── SCROLL MARQUEE ─────────────────────────── */}
      <div data-scrub="marquee" aria-hidden className="relative z-20 -mb-4 -rotate-2 overflow-hidden border-y-[3px] border-cola bg-cola py-3">
        <div data-marquee-track className="flex w-max gap-8 whitespace-nowrap font-retro text-3xl text-cotton md:text-4xl">
          {Array.from({ length: 3 }, (_, k) =>
            ["iced latte", "dirty chai", "cozy corners", "matcha", "study spots", "cold brew", "date night", "pistachio"].map((w, i) => (
              <span key={`${k}-${i}`} className="flex items-center gap-8">
                <span className={i % 2 ? "font-serif font-normal italic text-hotpink" : ""}>{w}</span>
                <Sparkle size={22} color="var(--color-lime)" />
              </span>
            )),
          )}
        </div>
      </div>

      {/* ─────────────────────────── HOW IT WORKS (letter from naksh) ─────────────────────────── */}
      <HowItWorks />

      {/* ─────────────────────────── WHERE TO? (passport stamps) ─────────────────────────── */}
      <section aria-labelledby="where" className="mx-auto max-w-6xl px-5 pt-24">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div>
            <p className="font-serif text-2xl">cafes anywhere in the world</p>
            <h2 id="where" className="font-display text-5xl md:text-6xl">
              where to?
            </h2>
          </div>
          <div className="flex w-full flex-col items-start gap-3 md:w-auto md:max-w-xl md:flex-1">
            <SearchBar variant="place" />
            <NearMeButton />
          </div>
        </div>

        <ul data-fx="rise" className="mt-10 grid grid-cols-3 gap-3 sm:gap-6 lg:grid-cols-4">
          {POPULAR_PLACES.map((p, i) => (
            <li key={p} data-fx-item>
              <Link
                href={`/search?where=${encodeURIComponent(p)}`}
                className="group block transition-transform hover:-translate-y-1"
                style={{ transform: `rotate(${[-2, 1.5, -1, 2, -1.5, 1][i % 6]}deg)` }}
              >
                <div className="stamp shadow-[var(--shadow-paper)]">
                  <div className={`flex aspect-[4/3] flex-col items-center justify-center gap-1 p-1.5 text-center sm:p-3 ${STAMP_BG[i % STAMP_BG.length]}`}>
                    <DrinkCup drink={STAMP_DRINKS[i % STAMP_DRINKS.length]} className="h-9 w-auto transition-transform group-hover:rotate-6 sm:h-14" />
                    <span className="font-display text-sm leading-none sm:text-xl">{p.split(",")[0]}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ─────────────────────────── MOOD FOLDERS ─────────────────────────── */}
      <section aria-labelledby="moods" className="mx-auto max-w-6xl px-5 pt-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-serif text-2xl italic">can&rsquo;t think of a mood?</p>
            <h2 id="moods" className="font-display text-5xl font-extrabold tracking-tighter md:text-6xl">
              my moods, in folders
            </h2>
          </div>
          <p className="max-w-xs font-hand text-2xl leading-tight">click a tab to pull a folder out ✦</p>
        </div>
        <div className="mt-6">
          <MoodFolders folders={MOODS} />
        </div>
      </section>

      {/* ─────────────────────────── LOVE NOTES ─────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pt-28">
        <p className="font-serif text-2xl italic">the wall of</p>
        <h2 className="font-display text-5xl font-extrabold tracking-tighter md:text-6xl">love notes</h2>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <p className="max-w-lg">Little testimonies from fellow cafe-hoppers, fresh off the wall.</p>
          <Link href="/notes" className="font-hand text-2xl underline decoration-hotpink decoration-2 underline-offset-4 hover:decoration-cola">
            read every love note →
          </Link>
        </div>

        {/* accounts are open */}
        <div className="relative mt-8 flex flex-col gap-4 rounded-3xl border-2 border-dashed border-cola bg-lemon/80 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-label text-xs uppercase tracking-[0.2em]">now open ✦</p>
            <p className="mt-1 font-display text-3xl">your latteletters account</p>
            <p className="mt-1 max-w-xl">
              Review the cafes you love, pin love notes with photos, and build your own profile. One email, no passwords.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block shrink-0 -rotate-6 self-start rounded-full border-[3px] border-ink bg-lime px-5 py-2 font-display text-xl shadow-[3px_4px_0_rgb(43_42_46/0.85)] transition hover:rotate-0 sm:self-center"
          >
            join in ✦
          </Link>
        </div>

        <HomeWall />
      </section>
    </>
  );
}

/** The newest real posts, or the example notes until there are some. */
async function HomeWall() {
  let posts: Post[] = [];
  try {
    posts = await recentPosts(4);
  } catch {
    // fall back to the examples
  }
  if (posts.length)
    return (
      <ul data-fx="drop" className="mt-10 grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((p) => (
          <li key={p.id} data-fx-item>
            <PostCard post={p} showCafe />
          </li>
        ))}
      </ul>
    );
  return (
        <ul data-fx="drop" className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {NOTES.map((n) => (
            <li
              key={n.text}
              data-fx-item
              className={`paper relative min-h-40 p-3.5 pt-6 shadow-[var(--shadow-paper)] sm:min-h-48 sm:p-5 sm:pt-7 ${n.tone}`}
              style={{ transform: `rotate(${n.r}deg)` }}
            >
              <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-2" />
              <p className="font-note text-lg leading-snug sm:text-2xl">{n.text}</p>
              <p className="mt-3 text-xs font-semibold sm:text-sm">{n.who}</p>
            </li>
          ))}
        </ul>
  );
}
