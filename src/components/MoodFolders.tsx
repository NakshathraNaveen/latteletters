"use client";

/**
 * "Can't think of a mood?" folder stack (moods inspo).
 *
 * Folders overlap like a real filing stack; only their tabs and a strip of
 * each body peek out. Clicking a tab pulls that folder open (the folders
 * after it slide down), so every tab stays reachable. On scroll, the folders
 * file themselves into the stack (scrubbed — see ScrollFx "file-in").
 */
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { DrinkCup } from "./DrinkCup";
import type { DrinkId } from "@/lib/drinks";

export type MoodFolder = {
  vibe: string;
  title: string;
  note: string;
  drink: DrinkId;
  folder: string;
  ink: string;
  /** what the vibe rule looks for in the map data */
  lookFor: string;
  drinkName: string;
};

/** tab positions: left, centre, right (right-anchored so it never spills off a phone screen) */
const TAB_POS: CSSProperties[] = [{ left: "3%" }, { left: "50%", transform: "translateX(-50%)" }, { right: "3%" }];

export function MoodFolders({ folders }: { folders: MoodFolder[] }) {
  // start with the last folder open (it's naturally fully visible on top)
  const [open, setOpen] = useState(folders.length - 1);

  return (
    <div data-scrub="file-in" className="relative pt-12 [--fh:20rem] [--peek:3.4rem] md:[--fh:19rem]">
      {folders.map((f, i) => {
        const isOpen = open === i;
        const prevOpen = open === i - 1;
        return (
          <div
            key={f.vibe}
            data-folder
            className="relative transition-[margin] duration-500 ease-out"
            style={{
              marginTop: i === 0 ? 0 : prevOpen ? "3.25rem" : "calc(-1 * (var(--fh) - var(--peek)))",
              zIndex: i + 1,
            }}
          >
            {/* tab */}
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-expanded={isOpen}
              aria-controls={`folder-${f.vibe}`}
              className={`paper absolute bottom-full z-10 -mb-px flex h-11 min-w-[7rem] items-center justify-center gap-2 rounded-t-2xl border-2 border-b-0 border-cola/70 px-3 font-label text-[11px] font-medium uppercase tracking-[0.14em] transition-transform hover:-translate-y-1 sm:min-w-[9.5rem] sm:px-5 sm:text-xs sm:tracking-[0.18em] ${f.folder} ${f.ink}`}
              style={TAB_POS[i % TAB_POS.length]}
            >
              {f.title}
            </button>

            {/* body */}
            <section
              id={`folder-${f.vibe}`}
              aria-label={`${f.title} folder`}
              className={`paper relative h-[var(--fh)] overflow-hidden rounded-2xl rounded-tl-md border-2 border-cola/70 shadow-[0_-6px_14px_-6px_rgb(71_19_28/0.35)] ${f.folder} ${f.ink}`}
            >
              {/* inner content sits below the peek strip */}
              <div
                className={`grid h-full grid-cols-[minmax(0,1fr)_6.5rem] content-start gap-5 p-5 pt-[calc(var(--peek)+0.25rem)] md:content-normal md:grid-cols-[1.1fr_0.9fr_1fr] md:items-center md:gap-8 md:px-10 ${
                  isOpen ? "" : "pointer-events-none"
                }`}
                inert={!isOpen}
              >
                {/* handwritten note with paperclip */}
                <div className="relative rotate-[-2deg] bg-lemon p-5 text-cola shadow-[var(--shadow-paper)]">
                  <svg aria-hidden viewBox="0 0 24 60" className="absolute -top-6 left-6 h-14 w-6">
                    <path
                      d="M8 52 V10 a6 6 0 0 1 12 0 V46 a3.5 3.5 0 0 1 -7 0 V16"
                      fill="none"
                      stroke="#8f8b96"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <p className="font-note text-xl leading-snug md:text-3xl">{f.note}</p>
                </div>

                {/* polaroid */}
                <figure className="mx-auto w-[6.5rem] rotate-[4deg] bg-lemon p-1.5 pb-1 shadow-[var(--shadow-paper)] md:w-40 md:p-2.5 md:pb-1.5">
                  <div className="grid aspect-square place-items-center bg-cotton-deep">
                    <DrinkCup drink={f.drink} className="h-4/5 w-auto" />
                  </div>
                  <figcaption className="pt-1 text-center font-hand text-sm leading-tight text-cola md:text-lg">{f.drinkName}</figcaption>
                </figure>

                {/* contents + CTA */}
                <div className="col-span-2 md:col-span-1">
                  <p className="font-label text-[11px] uppercase tracking-[0.2em] opacity-80">what we look for</p>
                  <p className="mt-1 text-sm">✦ {f.lookFor}</p>
                  <Link
                    href={`/search?q=${encodeURIComponent(f.title)}`}
                    tabIndex={isOpen ? 0 : -1}
                    className="mt-4 inline-block rounded-full border-2 border-current px-5 py-2 font-display text-sm font-bold transition hover:-translate-y-0.5"
                  >
                    open the {f.title} folder →
                  </Link>
                </div>
              </div>
            </section>
          </div>
        );
      })}
    </div>
  );
}
