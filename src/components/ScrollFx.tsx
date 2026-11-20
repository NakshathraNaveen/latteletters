"use client";

/**
 * Scroll-triggered motion (PRD §8.5).
 *
 * Server components opt in declaratively:
 *   <div data-fx="rise"> <Card data-fx-item /> … </div>
 *
 * This single client component finds every [data-fx] group (including ones
 * that stream in later, like search results) and runs the matching GSAP
 * preset. Everything lives inside gsap.matchMedia so users who prefer
 * reduced motion get static, fully-visible content — and content is never
 * hidden before JS runs, so nothing blocks reading or searching.
 */
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Preset = (group: HTMLElement, items: HTMLElement[]) => void;

const rand = gsap.utils.random;

const PRESETS: Record<string, Preset> = {
  /** Hero: words stagger in, echo rows slide, cup floats up, search bounces in last */
  hero(group) {
    const q = gsap.utils.selector(group);
    gsap
      .timeline({ defaults: { ease: "power3.out" } })
      .from(q("[data-fx-word]"), { yPercent: 60, opacity: 0, duration: 0.7, stagger: 0.06 })
      .from(q("[data-fx-echo]"), { opacity: 0, x: (i) => (i % 2 ? 24 : -24), duration: 0.8, stagger: 0.08 }, "-=0.5")
      .from(q("[data-fx-cup]"), { y: 30, scale: 0.92, opacity: 0, duration: 0.9 }, "-=0.7")
      .from(q("[data-fx-sparkle]"), { scale: 0.6, opacity: 0, duration: 0.45, stagger: 0.05, ease: "back.out(1.6)" }, "-=0.6")
      .from(q("[data-fx-search]"), { y: 16, opacity: 0, duration: 0.6 }, "-=0.3");
  },

  /** Mood chips: pop in like stickers with a slight rotation */
  stickers(group, items) {
    gsap.from(items, {
      scale: 0.7,
      rotate: () => rand(-10, 10),
      opacity: 0,
      duration: 0.45,
      ease: "back.out(1.6)",
      stagger: 0.07,
      scrollTrigger: { trigger: group, start: "top 90%", once: true },
    });
  },

  /** Folder nav: folders slide up and fan out */
  folders(group, items) {
    gsap.from(items, {
      yPercent: 40,
      rotate: (i) => (i - items.length / 2) * 2,
      opacity: 0,
      duration: 0.7,
      ease: "power3.out",
      stagger: 0.09,
      scrollTrigger: { trigger: group, start: "top 88%", once: true },
    });
  },

  /** How it works: polaroids pinned one by one, tape snapping on */
  pin(group, items) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: group, start: "top 75%", once: true } });
    items.forEach((el) => {
      tl.from(el, { y: -24, rotate: rand(-5, 5), opacity: 0, duration: 0.45, ease: "power2.out" });
      const tape = el.querySelectorAll(".tape");
      if (tape.length) tl.from(tape, { scaleX: 0, duration: 0.18, ease: "power4.out" }, "-=0.08");
    });
  },

  /** Results grid: cards rise and settle with stagger */
  rise(group, items) {
    gsap.from(items, {
      y: 30,
      opacity: 0,
      duration: 0.65,
      ease: "power3.out",
      stagger: 0.1,
      scrollTrigger: { trigger: group, start: "top 88%", once: true },
    });
  },

  /** Gallery: polaroids scatter, then straighten into place */
  scatter(group, items) {
    gsap.from(items, {
      x: () => rand(-50, 50),
      y: () => rand(-30, 40),
      rotate: () => rand(-12, 12),
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.08,
      scrollTrigger: { trigger: group, start: "top 80%", once: true },
    });
  },

  /** Reviews / notes: sticky notes drop in at slight angles */
  drop(group, items) {
    gsap.from(items, {
      y: -40,
      rotate: () => rand(-6, 6),
      opacity: 0,
      duration: 0.7,
      ease: "power2.out",
      stagger: 0.12,
      scrollTrigger: { trigger: group, start: "top 85%", once: true },
    });
  },

  /** Lace dividers: draw in from left to right */
  lace(group) {
    gsap.fromTo(
      group,
      { clipPath: "inset(0 100% 0 0)" },
      {
        clipPath: "inset(0 0% 0 0)",
        duration: 1.1,
        ease: "power2.inOut",
        scrollTrigger: { trigger: group, start: "top 95%", once: true },
      },
    );
  },

  /** Footer: oversized thank-you rises row by row */
  footer(group, items) {
    gsap.from(items, {
      yPercent: 40,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.12,
      scrollTrigger: { trigger: group, start: "top 90%", once: true },
    });
  },
};

/* ───────────────── scroll-DRIVEN (scrubbed) effects ─────────────────
 * These are tied to scroll position: scroll down and they play forward,
 * scroll back up and they rewind. Opt in with data-scrub="<name>".
 */
const scrub = (trigger: Element, start = "top bottom", end = "bottom top") => ({
  trigger,
  start,
  end,
  scrub: 0.6,
});

const SCRUBS: Record<string, (group: HTMLElement) => void> = {
  /** Hero: echo words slide apart, the cup floats up and tilts, stickers drift */
  hero(group) {
    const q = gsap.utils.selector(group);
    const st = scrub(group, "top top", "bottom top");
    gsap.to(q("[data-par-x]"), { x: (i) => (i % 2 ? 50 : -50), ease: "none", scrollTrigger: st });
    gsap.to(q("[data-par-cup]"), { y: -50, rotate: 4, ease: "none", scrollTrigger: st });
    gsap.to(q("[data-par-sticker]"), { y: (i) => -24 - i * 16, rotate: (i) => (i % 2 ? 6 : -6), ease: "none", scrollTrigger: st });
  },

  /** Marquee ribbon moves sideways as you scroll */
  marquee(group) {
    const q = gsap.utils.selector(group);
    gsap.fromTo(q("[data-marquee-track]"), { xPercent: 0 }, { xPercent: -18, ease: "none", scrollTrigger: scrub(group) });
  },

  /** A dashed coffee-drip path draws itself as you scroll */
  draw(group) {
    group.querySelectorAll<SVGPathElement>("path[data-draw]").forEach((path) => {
      const len = path.getTotalLength();
      gsap.fromTo(
        path,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, ease: "none", scrollTrigger: scrub(group, "top 75%", "bottom 55%") },
      );
    });
  },

  /** Mood folders file themselves into the stack */
  "file-in"(group) {
    const folders = group.querySelectorAll<HTMLElement>("[data-folder]");
    gsap.fromTo(
      folders,
      { y: (i) => 16 + i * 14, rotate: (i) => (i % 2 ? 0.8 : -0.8) },
      { y: 0, rotate: 0, ease: "none", scrollTrigger: scrub(group, "top 90%", "top 20%") },
    );
  },

  /** Generic parallax: every [data-par-y] child drifts at its own speed */
  creator(group) {
    group.querySelectorAll<HTMLElement>("[data-par-y]").forEach((el, i) => {
      const d = (i % 2 ? -1 : 1) * (8 + (i % 4) * 4);
      gsap.fromTo(el, { y: d }, { y: -d, ease: "none", scrollTrigger: scrub(group) });
    });
  },

  /** Receipt slides up and straightens; things behind it drift */
  receipt(group) {
    const q = gsap.utils.selector(group);
    gsap.fromTo(q("[data-receipt]"), { y: 30, rotate: -2 }, { y: 0, rotate: 0.5, ease: "none", scrollTrigger: scrub(group, "top bottom", "bottom 30%") });
    gsap.fromTo(q("[data-par-y]"), { y: (i) => (i ? -20 : 20) }, { y: (i) => (i ? 20 : -20), ease: "none", scrollTrigger: scrub(group) });
  },

  /** Footer: "thank" and "you!" slide toward each other */
  footer(group) {
    const q = gsap.utils.selector(group);
    gsap.fromTo(q("[data-par-x]"), { x: (i) => (i % 2 ? 50 : -50) }, { x: 0, ease: "none", scrollTrigger: scrub(group, "top bottom", "bottom bottom") });
  },
};

const FX_SELECTOR = "[data-fx], [data-lace], [data-scrub], [data-scroll-progress]";

/** Starts animations for any not-yet-processed groups under `root`; returns how many it started. */
function run(root: ParentNode): number {
  let started = 0;
  const select = (sel: string) => [
    ...(root instanceof HTMLElement && root.matches(sel) ? [root] : []),
    ...root.querySelectorAll<HTMLElement>(sel),
  ];

  for (const group of select("[data-fx], [data-lace]")) {
    if (group.dataset.fxDone) continue;
    group.dataset.fxDone = "1";
    const preset = group.hasAttribute("data-lace") ? "lace" : group.dataset.fx!;
    const items = [...group.querySelectorAll<HTMLElement>("[data-fx-item]")];
    PRESETS[preset]?.(group, items.length ? items : [group]);
    started++;
  }

  for (const group of select("[data-scrub]")) {
    if (group.dataset.scrubDone) continue;
    group.dataset.scrubDone = "1";
    SCRUBS[group.dataset.scrub!]?.(group);
    started++;
  }

  // "latte level" scroll-progress cup in the header
  for (const fill of select("[data-scroll-progress]")) {
    if (fill.dataset.scrubDone) continue;
    fill.dataset.scrubDone = "1";
    gsap.fromTo(
      fill,
      { scaleY: 0 },
      { scaleY: 1, ease: "none", scrollTrigger: { trigger: document.documentElement, start: 0, end: "max", scrub: 0.3 } },
    );
    started++;
  }
  return started;
}

export function ScrollFx() {
  const pathname = usePathname();

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", (ctx) => {
      run(document);
      let refreshQueued = false;

      // pick up content that streams in after hydration (e.g. Suspense results)
      const observer = new MutationObserver((records) => {
        // Only react to genuinely new animated content. ScrollTrigger itself
        // adds/removes a measuring element on every refresh, so refreshing
        // unconditionally here would loop forever and freeze the page.
        const added = records.flatMap((r) => [...r.addedNodes]).filter(
          (n): n is HTMLElement => n instanceof HTMLElement && (n.matches(FX_SELECTOR) || !!n.querySelector(FX_SELECTOR)),
        );
        if (!added.length) return;

        let started = 0;
        ctx.add(() => {
          for (const n of added) started += run(n);
        });
        if (started && !refreshQueued) {
          refreshQueued = true;
          requestAnimationFrame(() => {
            refreshQueued = false;
            ScrollTrigger.refresh();
          });
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      // fonts change layout → recompute trigger positions
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      return () => {
        observer.disconnect();
        document.querySelectorAll<HTMLElement>("[data-fx-done]").forEach((el) => delete el.dataset.fxDone);
        document.querySelectorAll<HTMLElement>("[data-scrub-done]").forEach((el) => delete el.dataset.scrubDone);
      };
    });
    return () => mm.revert();
  }, [pathname]);

  return null;
}
