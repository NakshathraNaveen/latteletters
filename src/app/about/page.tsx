import type { Metadata } from "next";
import Image from "next/image";
import { CREATOR, GO_TO_ORDER } from "@/data/creator";
import { Barcode } from "@/components/CafeIdCard";
import { DrinkCup } from "@/components/DrinkCup";
import { LaceDivider, MetalStar, Sparkle } from "@/components/decor";

export const metadata: Metadata = {
  title: "Meet the creator",
  description: "The person behind latteletters, and her go-to coffee order.",
};

/* ───────────── pieces ───────────── */

function Bubble({ children, className = "", tail = "left" }: { children: React.ReactNode; className?: string; tail?: "left" | "right" }) {
  return (
    <span
      data-par-y
      className={`absolute z-30 whitespace-nowrap rounded-xl bg-ink px-3 py-1.5 font-sans text-xs font-semibold tracking-wide text-lemon shadow-md sm:px-4 sm:py-2 sm:text-sm md:text-base ${className}`}
    >
      {children}
      <span
        aria-hidden
        className={`absolute -bottom-1.5 size-3 rotate-45 bg-ink ${tail === "left" ? "left-4" : "right-4"}`}
      />
    </span>
  );
}

function Scallop({ className = "" }: { className?: string }) {
  // flower-ish scalloped blob (the soft shapes behind the envelope)
  const petals = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return <circle key={i} cx={50 + Math.cos(a) * 34} cy={50 + Math.sin(a) * 34} r="17" />;
  });
  return (
    <svg aria-hidden viewBox="0 0 100 100" className={className}>
      <g fill="var(--color-lavender)" opacity="0.55">
        <circle cx="50" cy="50" r="36" />
        {petals}
      </g>
    </svg>
  );
}

/** blank-line placeholder for anything not filled in yet */
const blank = (v: string | null) => v ?? "_______________";

/* ───────────── page ───────────── */

export default function AboutPage() {
  const o = GO_TO_ORDER;
  const orderRows: [string, string | null][] = [
    ["Name", CREATOR.nickname],
    ["Drink", o.drink],
    ["Size", o.size],
    ["Milk", o.milk],
    ["Sweetness", o.sweetness],
    ["Temp", o.temperature],
    ["Extras", o.extras],
  ];

  return (
    <div className="pb-8">
      {/* ─────────────────── MEET THE CREATOR ─────────────────── */}
      <section aria-labelledby="meet" className="mx-auto max-w-6xl px-5 pt-10">
        <div className="paper relative overflow-hidden rounded-3xl border-2 border-cola/15 bg-[#f6eef2] px-5 py-8 shadow-[var(--shadow-paper)] md:px-12">
          {/* header / footer credits like the inspo */}
          <div className="flex justify-between font-mono text-sm text-cola/80">
            <span>{CREATOR.nickname}</span>
            <span>{CREATOR.handle ?? "latteletters"}</span>
          </div>

          <div data-scrub="creator" className="relative mx-auto mt-6 aspect-[4/5] w-full max-w-xl">
            <h1 id="meet" className="sr-only">
              Meet the creator: {CREATOR.name}
            </h1>

            {/* "meet the" pixel type */}
            <p
              aria-hidden
              data-par-y
              className="absolute left-[2%] top-[4%] z-30 font-pixel text-[clamp(2.75rem,9vw,4.75rem)] font-bold leading-[0.85] text-hotpink [text-shadow:3px_3px_0_var(--color-cola)]"
            >
              meet
              <br />
              the
            </p>

            <Scallop className="absolute -right-[6%] top-[8%] w-[38%]" />
            <Scallop className="absolute -left-[8%] top-[52%] w-[32%]" />

            {/* envelope back + open flap */}
            <svg aria-hidden viewBox="0 0 400 300" className="absolute inset-x-[4%] bottom-[14%] w-[92%]">
              <defs>
                <linearGradient id="velvet" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f39cc0" />
                  <stop offset="0.5" stopColor="#e2669c" />
                  <stop offset="1" stopColor="#d4558c" />
                </linearGradient>
              </defs>
              <path d="M20 80 L200 -40 L380 80 Z" fill="#e8739f" />
              <rect x="20" y="80" width="360" height="210" rx="16" fill="url(#velvet)" />
            </svg>

            {/* polaroid tucked in the envelope */}
            <figure data-par-y className="absolute left-[22%] top-[11%] z-10 w-[52%] rotate-[-3deg] bg-white p-3 pb-10 shadow-[var(--shadow-lift)]">
              {/* yellow binder clip */}
              <svg aria-hidden viewBox="0 0 80 70" className="absolute -top-9 left-1/2 w-16 -translate-x-1/2">
                <path d="M24 40 L22 8 Q40 -2 58 8 L56 40" fill="none" stroke="#f3e39b" strokeWidth="6" strokeLinejoin="round" />
                <path d="M8 36 H72 L66 66 H14 Z" fill="#f6e8a6" stroke="#d9c773" strokeWidth="2" />
                <circle cx="40" cy="22" r="6" fill="#fffde9" stroke="#d9c773" strokeWidth="2" />
              </svg>
              <div className="relative grid aspect-[4/5] place-items-center overflow-hidden bg-cotton-deep">
                {CREATOR.photo ? (
                  <Image
                    src={CREATOR.photo}
                    alt={`Photo of ${CREATOR.name}`}
                    fill
                    priority
                    sizes="(min-width: 768px) 480px, 80vw"
                    className="object-cover"
                    style={{ objectPosition: CREATOR.photoFocus, transformOrigin: CREATOR.photoFocus, scale: String(CREATOR.photoZoom) }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <DrinkCup drink="strawberry-matcha" className="h-28 w-auto" />
                    <span className="font-hand text-lg leading-tight text-cola/80">photo of naksh coming soon</span>
                  </div>
                )}
              </div>
              <MetalStar size={30} className="absolute -right-3 top-6 animate-twinkle" />
            </figure>

            {/* photobooth strip */}
            <div data-par-y className="absolute right-[3%] top-[22%] z-[25] flex w-[21%] rotate-[6deg] flex-col gap-1.5 bg-white p-1.5 pb-4 shadow-[var(--shadow-paper)]">
              {(CREATOR.photobooth.length ? CREATOR.photobooth : [null, null, null]).map((shot, i) =>
                shot ? (
                  <div key={i} className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={shot.src}
                      alt={`Photobooth photo ${i + 1} of ${CREATOR.nickname}`}
                      fill
                      sizes="160px"
                      className="object-cover"
                      style={{ objectPosition: shot.focus }}
                    />
                  </div>
                ) : (
                  <div key={i} className="grid aspect-[4/3] place-items-center bg-[#d9d4dc]">
                    <Sparkle size={14} color="#ffffff" />
                  </div>
                ),
              )}
            </div>

            {/* envelope front pocket */}
            <svg aria-hidden viewBox="0 0 400 200" className="absolute inset-x-[4%] bottom-[14%] z-20 w-[92%]">
              <path d="M20 10 L200 120 L380 10 L380 184 Q380 200 364 200 L36 200 Q20 200 20 184 Z" fill="#ec80ad" />
              <path d="M20 10 L200 120 L380 10" fill="none" stroke="#c94c82" strokeWidth="2" opacity="0.6" />
              <path d="M20 200 L170 100 M380 200 L230 100" stroke="#c94c82" strokeWidth="2" opacity="0.45" />
            </svg>

            {/* speech bubbles */}
            {/* on phones the first bubble sits below the face instead of across it */}
            <Bubble className="left-[0%] top-[50%] sm:top-[34%]">{CREATOR.tags[0]}</Bubble>
            <Bubble className="right-[0%] top-[62%]" tail="right">
              {CREATOR.tags[1]}
            </Bubble>
            <Bubble className="left-[4%] top-[74%]">{CREATOR.tags[2]}</Bubble>

            {/* "creator" script */}
            <p
              aria-hidden
              data-par-y
              className="absolute inset-x-0 bottom-[2%] z-30 text-center font-serif text-[clamp(4rem,15vw,8rem)] italic leading-none text-lemon [-webkit-text-stroke:2px_var(--color-cola)]"
            >
              creator
            </p>
          </div>

          <div className="flex justify-between font-mono text-sm text-cola/80">
            <span>{CREATOR.nickname}</span>
            <span>{CREATOR.handle ?? "latteletters"}</span>
          </div>
        </div>
      </section>

      {/* ─────────────────── ABOUT ─────────────────── */}
      <section aria-labelledby="hello" className="mx-auto mt-20 grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:items-center">
        <h2 id="hello" className="font-display text-[clamp(3rem,8vw,5.5rem)] font-extrabold leading-[0.9] tracking-tighter">
          <span className="inline-block bg-cola px-3 pb-1 pt-3 leading-none text-cotton">hello!</span>
          <br />
          i&rsquo;m <span className="font-serif font-normal italic">{CREATOR.nickname}</span>
        </h2>
        <div data-fx="drop" className="grid gap-5">
          {CREATOR.bio.map((p, i) => (
            <p
              key={i}
              data-fx-item
              className={`paper relative p-5 pt-6 text-lg shadow-[var(--shadow-paper)] ${i % 2 ? "bg-lavender/70" : "bg-lemon"}`}
              style={{ transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` }}
            >
              <span className="tape -top-3 left-8 -rotate-3" />
              {p}
            </p>
          ))}
          <p className="font-hand text-xl">full name: {CREATOR.name}</p>
        </div>
      </section>

      <LaceDivider color="var(--color-hotpink)" className="mx-auto mt-20 max-w-6xl opacity-80" />

      {/* ─────────────────── GO-TO ORDER ─────────────────── */}
      <section aria-labelledby="order" className="mx-auto mt-16 max-w-6xl px-5">
        <div
          className="gingham relative overflow-hidden rounded-3xl border-2 border-cola/15 px-5 py-12 md:px-12"
          style={{ clipPath: "inset(0 round 1.5rem)" }}
        >
          {/* sage diagonal like the inspo */}
          <div aria-hidden className="absolute inset-0 bg-[#dfe3cf] [clip-path:polygon(0_0,38%_0,78%_100%,0_100%)]" />

          <div className="relative text-center">
            <h2 id="order" className="font-serif text-[clamp(2.75rem,8vw,5rem)] leading-none text-cola">
              naksh&rsquo;s go-to order
            </h2>
            <p className="mt-5 font-display text-xl">the usual, please ✦</p>
          </div>

          <div data-scrub="receipt" className="relative mx-auto mt-10 max-w-md">
            {/* stuff peeking out behind the receipt */}
            <div aria-hidden data-par-y className="absolute -left-16 top-10 hidden h-64 w-40 -rotate-6 rounded-md bg-[#7d1f2e] shadow-lg sm:block">
              <div className="absolute inset-y-3 left-2 flex flex-col justify-between">
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} className="block size-2.5 rounded-full border-2 border-[#c9c6cf]" />
                ))}
              </div>
            </div>
            <div aria-hidden data-par-y className="absolute -right-20 -top-10 hidden rotate-12 sm:block">
              <DrinkCup drink="iced-latte" className="h-56 w-auto" />
            </div>

            <div className="relative drop-shadow-[0_18px_22px_rgb(71_19_28/0.3)]" data-receipt>
              <div className="receipt bg-[#f4f1ea] px-8 py-10 font-mono text-cola">
                <p className="text-center text-xl font-bold">Order!</p>
                <p className="text-center text-sm tracking-widest">CONFIRM AT THE COUNTER</p>

                <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                  {orderRows.map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt>{k} :</dt>
                      <dd className={v ? "font-bold" : "text-cola/40"}>{blank(v)}</dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-6 font-bold underline underline-offset-4">Notes</p>
                <ul className="mt-1 list-inside list-disc text-sm">
                  {(o.notes.length ? o.notes : [null, null]).map((n, i) => (
                    <li key={i} className={n ? "" : "text-cola/40"}>
                      {blank(n)}
                    </li>
                  ))}
                </ul>

                <p className="mt-6 text-center text-sm font-bold">
                  Don&rsquo;t forget to tag the cafe
                  <br />
                  Thanks for your order
                </p>
                <Barcode seed="naksh-go-to-order" className="mt-4 h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
