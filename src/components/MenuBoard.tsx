/**
 * "the menu" on a cafe page. Map data has no menus, so this is the menu as
 * told by people who've been: drinks ordered in reviews (with their stars)
 * and "what to order" picks from public lists. Plus a link to the cafe's own
 * menu or website, or a web search for it when we don't know either.
 * The home page's cafe search links straight here (/cafe/<id>#menu).
 */
import Link from "next/link";
import { recommendationsFor } from "@/lib/lists";
import { drinkName, postsForCafe } from "@/lib/posts";
import type { Cafe } from "@/lib/types";

type Item = { name: string; orders: number; stars: number[]; from: Set<string> };

const key = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export async function MenuBoard({ cafe }: { cafe: Cafe }) {
  const [posts, recs] = await Promise.all([postsForCafe(cafe.id).catch(() => []), recommendationsFor(cafe.id).catch(() => [])]);

  const items = new Map<string, Item>();
  const add = (name: string, who: string, stars?: number | null) => {
    const k = key(name);
    if (!k) return;
    const it = items.get(k) ?? { name, orders: 0, stars: [], from: new Set<string>() };
    it.orders++;
    if (stars) it.stars.push(stars);
    it.from.add(who);
    items.set(k, it);
  };
  for (const p of posts) {
    const d = p.kind === "review" ? drinkName(p.drink) : null;
    if (d) add(d, p.author.username, p.rating);
  }
  for (const r of recs) if (r.recommend) add(r.recommend.slice(0, 60), r.username);

  const board = [...items.values()]
    .sort((a, b) => b.orders - a.orders || avg(b.stars) - avg(a.stars) || a.name.localeCompare(b.name))
    .slice(0, 12);

  const website = cafe.socials.find((s) => s.platform === "website")?.url ?? null;
  const officialMenu = cafe.menuUrl ?? null;
  const searchMenu = `https://www.google.com/search?q=${encodeURIComponent([cafe.name, cafe.city, "menu"].filter(Boolean).join(" "))}`;

  return (
    <section id="menu" aria-labelledby="menu-title" className="mt-14 scroll-mt-24">
      <div className="paper relative mx-auto max-w-3xl -rotate-[0.6deg] border-2 border-cola bg-lemon px-6 pb-7 pt-8 shadow-[var(--shadow-lift)] sm:px-10">
        <span className="tape -top-3 left-10 -rotate-6" />
        <span className="tape -top-3 right-10 rotate-6" />
        <p className="text-center font-label text-xs uppercase tracking-[0.25em]">{cafe.name}</p>
        <h2 id="menu-title" className="mt-1 text-center font-display text-4xl md:text-5xl">
          the menu <span className="font-serif text-3xl italic md:text-4xl">by the regulars</span>
        </h2>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-cola/80">
          What people on latteletters ordered here, from their reviews and lists.
        </p>

        {board.length > 0 ? (
          <ul className="mt-6 divide-y-2 divide-dashed divide-cola/25 font-mono text-sm sm:text-base">
            {board.map((it) => (
              <li key={key(it.name)} className="flex items-baseline gap-3 py-2.5">
                <span className="min-w-0 flex-1 break-words font-semibold">{it.name}</span>
                {it.stars.length > 0 && (
                  <span className="shrink-0" aria-label={`rated ${avg(it.stars).toFixed(1)} out of 5`}>
                    ★ {avg(it.stars).toFixed(1)}
                  </span>
                )}
                <span className="shrink-0 text-cola/75">
                  ordered {it.orders === 1 ? "once" : `${it.orders}×`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-center font-hand text-2xl">
            nobody&rsquo;s said what they ordered here yet. Been? <Link href="#love-notes" className="underline">Write the first review</Link> and
            your drink goes on the board ✦
          </p>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3 border-t-2 border-cola pt-5">
          {officialMenu ? (
            <MenuLink href={officialMenu} primary>
              see their full menu ↗
            </MenuLink>
          ) : website ? (
            <MenuLink href={website} primary>
              menu on their website ↗
            </MenuLink>
          ) : null}
          <MenuLink href={searchMenu} primary={!officialMenu && !website}>
            {officialMenu || website ? "search the web for it ↗" : "find their menu online ↗"}
          </MenuLink>
        </div>
      </div>
    </section>
  );
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function MenuLink({ href, primary, children }: { href: string; primary?: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`rounded-full border-2 border-cola px-5 py-1.5 font-display transition hover:-translate-y-0.5 ${
        primary ? "bg-hotpink shadow-[3px_3px_0_var(--color-cola)] hover:bg-cola hover:text-cotton" : "bg-cotton hover:bg-cotton-deep"
      }`}
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
