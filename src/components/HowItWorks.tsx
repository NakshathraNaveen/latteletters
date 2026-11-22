import Image from "next/image";
import Link from "next/link";
import { FOR_YOU_IF, HOW_IT_WORKS, LETTER } from "@/data/how-it-works";
import { DrinkCup } from "./DrinkCup";
import { Polaroid } from "./Polaroid";
import { LaceDivider, PaperStar, Sparkle } from "./decor";

/** Illustrated stand-ins for the polaroids (used when a step has no image). */
const FALLBACK = [
  <div key="craving" className="grid aspect-square place-items-center bg-cotton">
    <DrinkCup drink="dirty-chai" className="h-3/4 w-auto" />
  </div>,
  <div key="vibe" className="flex aspect-square flex-wrap content-center justify-center gap-2 bg-lavender/60 p-4">
    {["🧸 cozy", "📚 study", "💌 date", "📸 aesthetic", "🌙 late-night"].map((t, i) => (
      <span
        key={t}
        className="rounded-full border-2 border-cola bg-lemon px-3 py-1 text-sm font-semibold"
        style={{ transform: `rotate(${[-6, 4, -3, 6, -4][i]}deg)` }}
      >
        {t}
      </span>
    ))}
  </div>,
  <div key="say-hi" className="relative grid aspect-square place-items-center bg-hotpink/70">
    <PaperStar size={150} className="absolute opacity-90" />
    <span className="relative font-display text-3xl font-extrabold tracking-tight">@ your new spot</span>
  </div>,
];

const NOTE_TONES = ["bg-cotton", "bg-lavender/70", "bg-lime/60"];

/** Lined notebook paper; --lh is the line height so the text sits on the lines. */
const LINED = {
  backgroundImage:
    "linear-gradient(90deg, transparent 2.4rem, rgb(240 140 184 / 0.55) 2.4rem, rgb(240 140 184 / 0.55) calc(2.4rem + 2px), transparent calc(2.4rem + 2px)), repeating-linear-gradient(transparent 0 calc(var(--lh) - 1px), rgb(71 19 28 / 0.12) calc(var(--lh) - 1px) var(--lh))",
  backgroundPositionY: "var(--lh-offset)",
} as const;

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="relative bg-lemon">
      <LaceDivider color="var(--color-lemon)" flip className="absolute inset-x-0 -top-7" />
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="how-title" className="font-display text-5xl font-extrabold tracking-tighter md:text-6xl">
            how it <span className="font-serif font-normal italic">works</span>
          </h2>
          <p className="max-w-sm font-hand text-2xl leading-tight">first, a little letter. then three easy steps.</p>
        </div>

        {/* ── the letter + who it's for ── */}
        <div data-fx="rise" className="mt-12 grid items-start gap-12 md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] md:gap-10">
          <div data-fx-item className="relative">
            {/* lined paper */}
            <article
              aria-label="A letter from naksh"
              className="paper relative -rotate-1 bg-[#fffef6] pb-14 pl-14 pr-6 pt-8 shadow-[var(--shadow-paper)] [--lh:1.9rem] [--lh-offset:1.95rem] sm:pr-10 md:[--lh:2.15rem] md:[--lh-offset:2.25rem]"
              style={LINED}
            >
              <span className="tape -top-3 left-10 -rotate-6" />
              <span className="tape -top-3 right-8 rotate-6" />
              <div className="font-letter text-lg leading-[var(--lh)] md:text-xl">
                <p>{LETTER.greeting}</p>
                {LETTER.paragraphs.map((p) => (
                  <p key={p.slice(0, 24)} className="mt-[var(--lh)]">
                    {p}
                  </p>
                ))}
                <p className="mt-[var(--lh)]">{LETTER.signOff}</p>
              </div>
              <p className="mt-1 flex items-center gap-3 font-hand text-4xl leading-none text-[#c94c82]">
                {LETTER.signature}
                <span aria-hidden className="text-2xl">
                  ♡
                </span>
                <DrinkCup drink="brown-sugar-shaken-espresso" className="h-14 w-auto rotate-6" />
              </p>
            </article>

            {/* envelope it slid out of, with the p.s. on the front */}
            <div className="relative z-10 -mt-10 mx-[-0.5rem] rotate-1 sm:mx-2">
              <svg aria-hidden viewBox="0 0 400 120" preserveAspectRatio="none" className="absolute inset-0 h-full w-full drop-shadow-[3px_4px_0_rgb(71_19_28/0.18)]">
                <path d="M0 0 L200 64 L400 0 L400 112 Q400 120 392 120 L8 120 Q0 120 0 112 Z" fill="#ec80ad" />
                <path d="M0 0 L200 64 L400 0" fill="none" stroke="#c94c82" strokeWidth="2" opacity="0.7" />
                <path d="M0 120 L160 60 M400 120 L240 60" stroke="#c94c82" strokeWidth="2" opacity="0.4" />
              </svg>
              <p className="relative px-6 pb-5 pt-16 text-center font-hand text-lg leading-snug text-cola sm:px-14 sm:text-xl">{LETTER.ps}</p>
            </div>
          </div>

          {/* this is for you if… */}
          <div data-fx-item className="relative md:pt-6">
            <div className="paper relative rotate-[1.5deg] rounded-2xl border-2 border-cola/70 bg-cotton p-6 pt-8 shadow-[var(--shadow-paper)]">
              <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-2" />
              <Sparkle size={22} color="var(--color-hotpink)" className="absolute -right-3 -top-3" />
              <h3 className="font-display text-3xl leading-none">
                this is for you <span className="font-serif font-normal italic">if…</span>
              </h3>
              <ul className="mt-5 space-y-3">
                {FOR_YOU_IF.map((line) => (
                  <li key={line} className="flex items-start gap-3 text-base leading-snug sm:text-lg">
                    <span aria-hidden className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border-2 border-cola bg-lemon font-hand text-xl leading-none text-[#c94c82]">
                      ✓
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t-2 border-dashed border-cola/25 pt-4 font-hand text-xl leading-tight">
                ticked even one? you belong here ✦{" "}
                <Link href="/about" className="whitespace-nowrap underline underline-offset-4">
                  meet naksh →
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* ── three little steps ── */}
        <h3 className="mt-20 font-hand text-3xl">three little steps:</h3>
        <div data-scrub="draw" className="relative">
          {/* coffee-drip line that draws itself between the polaroids as you scroll */}
          <svg aria-hidden viewBox="0 0 1000 300" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-[22%] hidden h-48 w-full -translate-y-1/2 sm:block">
            <path
              data-draw
              d="M30 160 C150 20 250 280 360 150 S560 40 640 170 S860 260 970 120"
              fill="none"
              stroke="var(--color-hotpink)"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
          <ol data-fx="pin" className="relative mt-8 grid grid-cols-3 gap-3 sm:mt-10 sm:gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <li key={step.caption} data-fx-item className={i === 1 ? "mt-6 sm:mt-10" : ""}>
                <Polaroid rotate={[-4, 3, -2][i]} caption={<><b>{i + 1}.</b> {step.caption}</>}>
                  {step.image ? (
                    <div className="relative aspect-square">
                      <Image src={step.image} alt={step.alt} fill sizes="33vw" className="object-cover" style={{ objectPosition: step.focus }} />
                    </div>
                  ) : (
                    FALLBACK[i]
                  )}
                </Polaroid>
                {/* sticky note under each polaroid (laptops/tablets) */}
                <p
                  className={`paper relative mx-2 mt-6 hidden p-4 pt-5 text-base leading-snug shadow-[var(--shadow-paper)] sm:block ${NOTE_TONES[i]}`}
                  style={{ transform: `rotate(${[2, -1.5, 1.5][i]}deg)` }}
                >
                  <span className="tape -top-3 left-1/2 w-16 -translate-x-1/2 rotate-3" />
                  {step.note}
                </p>
              </li>
            ))}
          </ol>
          {/* on phones the notes get their own full-width row */}
          <ol className="mt-8 space-y-4 sm:hidden">
            {HOW_IT_WORKS.map((step, i) => (
              <li
                key={step.caption}
                className={`paper relative p-4 text-sm leading-snug shadow-[var(--shadow-paper)] ${NOTE_TONES[i]}`}
                style={{ transform: `rotate(${[1, -1, 0.8][i]}deg)` }}
              >
                <b className="font-hand text-lg">
                  {i + 1}. {step.caption}:
                </b>{" "}
                {step.note}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <LaceDivider color="var(--color-lemon)" className="absolute inset-x-0 -bottom-7 z-10" />
    </section>
  );
}
