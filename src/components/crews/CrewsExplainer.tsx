/** "what's a crew?": the three steps, what it's good for, and who can see it. */
import Link from "next/link";
const STEPS = [
  {
    n: "1",
    title: "start a crew",
    body: "Give it a name and a mascot, like “sunday brunch club 🥐” or “finals study spots 📚”.",
    tone: "bg-lemon",
    r: -2,
  },
  {
    n: "2",
    title: "invite your people",
    body: "Send the crew’s invite link in your group chat, or invite friends by their latteletters username. They accept or decline.",
    tone: "bg-lavender/70",
    r: 1.5,
  },
  {
    n: "3",
    title: "build a shared cafe list",
    body: "On any cafe page, tap “add to crew” and leave a note (“the pistachio latte!!”). Everyone can add cafes and ♡ each other’s picks.",
    tone: "bg-hotpink/60",
    r: -1,
  },
];

const IDEAS = ["your roommates’ go-to study spots", "a weekend cafe crawl with the girls", "places to try with your partner", "a trip itinerary, cafe by cafe"];

export function CrewsExplainer() {
  return (
    <section aria-labelledby="what-crew" className="mt-8">
      <h2 id="what-crew" className="sr-only">
        how crews work
      </h2>
      <p className="max-w-2xl text-lg">
        A <b>crew</b> is a private group for you and your friends to plan where to go next. It&rsquo;s one shared cafe list that
        everyone in the group can add to, so the &ldquo;we should go there!!&rdquo; spots stop getting lost in the group chat.
      </p>

      <ol className="mt-8 grid gap-6 sm:grid-cols-3">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className={`paper relative rounded-2xl border-2 border-cola p-5 pt-7 shadow-[var(--shadow-paper)] ${s.tone}`}
            style={{ transform: `rotate(${s.r}deg)` }}
          >
            <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-2" />
            <span aria-hidden className="absolute -left-3 -top-3 grid size-10 place-items-center rounded-full border-2 border-cola bg-cotton font-display text-xl">
              {s.n}
            </span>
            <h3 className="font-display text-2xl leading-tight">
              <span className="sr-only">Step {s.n}: </span>
              {s.title}
            </h3>
            <p className="mt-2">{s.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-dashed border-cola/60 bg-cotton-deep/60 p-5">
          <p className="font-hand text-2xl">good for…</p>
          <ul className="mt-2 space-y-1">
            {IDEAS.map((i) => (
              <li key={i}>✦ {i}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-cola/60 bg-lemon/70 p-5">
          <p className="font-hand text-2xl">🔒 just for your crew</p>
          <p className="mt-2">
            Only crew members can see a crew, its cafes and its notes. It never shows on your profile. (Want to share picks with
            everyone? Make a public <Link href="/lists" className="underline underline-offset-4">cafe list</Link> instead.)
          </p>
        </div>
      </div>
    </section>
  );
}
