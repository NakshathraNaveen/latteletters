import { Suspense } from "react";
import { LaceDivider, MetalStar, Sparkle } from "./decor";
import { ScrollFx } from "./ScrollFx";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-cola text-cotton">
      <LaceDivider color="var(--color-cotton)" flip className="absolute inset-x-0 -top-px" />

      {/* drifting star trail */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {[
          ["8%", "30%", 0],
          ["22%", "62%", 0.6],
          ["71%", "24%", 1.2],
          ["86%", "58%", 1.8],
          ["50%", "16%", 2.4],
        ].map(([left, top, delay], i) => (
          <MetalStar
            key={i}
            size={i % 2 ? 30 : 44}
            className="absolute animate-float"
            style={{ left: left as string, top: top as string, animationDelay: `${delay}s` }}
          />
        ))}
        <Sparkle size={26} color="var(--color-lime)" className="absolute left-[38%] top-[70%] animate-twinkle" />
        <Sparkle size={20} color="var(--color-lavender)" className="absolute left-[62%] top-[44%] animate-twinkle [animation-delay:1s]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-20">
        <p data-fx="footer" data-scrub="footer" className="overflow-hidden font-retro leading-[0.85]">
          <span data-par-x className="block">
            <span data-fx-item className="block text-[clamp(4rem,16vw,13rem)] text-hotpink">
              thank
            </span>
          </span>
          <span data-par-x className="block">
            <span data-fx-item className="block text-right text-[clamp(4rem,16vw,13rem)] text-cotton">
              you<span className="font-serif font-normal italic">!</span>
            </span>
          </span>
        </p>
        <p className="mt-4 max-w-md font-serif text-2xl italic">for sipping through latteletters — go find your new favourite cup.</p>

        <div className="mt-12 flex flex-col gap-3 border-t border-cotton/25 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            Made with oat milk &amp; love in Waterloo Region, Canada.{" "}
            <span className="text-cotton/75">
              Cafe data from the <a href="https://docs.overturemaps.org/attribution/" className="underline" target="_blank" rel="noopener noreferrer">Overture Maps Foundation</a> and © <a href="https://www.openstreetmap.org/copyright" className="underline" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>.
            </span>
          </p>
          <p>
            Own a cafe or spotted a mistake?{" "}
            <a
              href="mailto:latteletters.contact@gmail.com?subject=latteletters%20listing%20update"
              className="font-semibold underline underline-offset-4"
            >
              Claim or correct a listing
            </a>
          </p>
        </div>
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <a href="/people" className="underline underline-offset-4">
            Find people
          </a>
          <a href="/notes" className="underline underline-offset-4">
            Love notes
          </a>
          <a href="/find" className="underline underline-offset-4">
            Review a cafe
          </a>
          <a href="/add-cafe" className="underline underline-offset-4">
            Add a cafe
          </a>
          <a href="/privacy" className="underline underline-offset-4">
            Privacy
          </a>
          <a href="/privacy#guidelines" className="underline underline-offset-4">
            Community guidelines
          </a>
        </p>
      </div>

      {/* scroll-triggered motion for the whole site */}
      <Suspense fallback={null}>
        <ScrollFx />
      </Suspense>
    </footer>
  );
}
