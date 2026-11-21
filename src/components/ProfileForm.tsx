"use client";

import { useActionState, useState, type ReactNode } from "react";
import type { FormState } from "@/app/actions/posts";
import { saveProfile } from "@/app/actions/profile";
import {
  CUP_COLOURS,
  CUP_DRINKS,
  CUP_PATTERNS,
  CUP_STYLES,
  DEFAULT_CUP,
  describeCup,
  encodeCup,
  keys,
  parseCup,
  randomCup,
  type Cup,
} from "@/lib/avatar";
import { CupAvatar } from "./CupAvatar";
import { btn, btnQuiet, FormMessage, input, label } from "./ui";

const CHAI = new Set(["masala", "karak", "kashmiri", "chailatte", "dirtychai"]);

const option = (on: boolean) =>
  `cursor-pointer rounded-2xl border-2 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-hotpink/60 ${
    on ? "border-cola bg-lemon shadow-[2px_2px_0_var(--color-cola)]" : "border-transparent hover:border-cola/40"
  }`;

function Group({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className={label}>{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/** Username + build-your-own cup avatar (used on /welcome and /settings). */
export function ProfileForm({
  initial,
  next,
  submitLabel = "save",
}: {
  initial?: { username: string; avatar: string };
  /** where to go after saving (omit to stay on the page) */
  next?: string;
  submitLabel?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, {});
  const [cup, setCup] = useState<Cup>(() => (initial && parseCup(initial.avatar)) || DEFAULT_CUP);
  const set = (part: Partial<Cup>) => setCup((c) => ({ ...c, ...part }));

  const radio = <K extends keyof Cup>(k: K, v: Cup[K], name: string) => (
    <>
      <input type="radio" name={`cup-${k}`} value={v} checked={cup[k] === v} onChange={() => set({ [k]: v } as Partial<Cup>)} className="sr-only" />
      <span className="sr-only">{name}</span>
    </>
  );

  return (
    <form action={action} className="space-y-6">
      {next !== undefined && <input type="hidden" name="next" value={next} />}
      <input type="hidden" name="avatar" value={encodeCup(cup)} />
      <div className="space-y-1.5">
        <label htmlFor="username" className={label}>
          username
        </label>
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl">@</span>
          <input
            id="username"
            name="username"
            required
            minLength={3}
            maxLength={20}
            pattern="[A-Za-z0-9_]{3,20}"
            defaultValue={initial?.username}
            autoComplete="username"
            placeholder="iced_latte_lover"
            aria-describedby="username-hint"
            className={input}
          />
        </div>
        <p id="username-hint" className="text-sm text-cola/75">
          3–20 letters, numbers or underscores. This is shown on your notes. Don&rsquo;t use your full name unless you want to.
        </p>
      </div>

      <div>
        <h2 className={label}>design your cup</h2>
        <div className="mt-3 grid gap-6 md:grid-cols-[13rem_1fr]">
          <div className="md:sticky md:top-24 md:self-start">
            <div className="paper relative grid place-items-center rounded-3xl bg-lemon p-4 shadow-[var(--shadow-paper)]">
              <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-2" />
              <CupAvatar cup={cup} className="h-40 w-auto" />
              <p className="mt-2 text-center font-hand text-lg leading-tight" aria-live="polite">
                {describeCup(cup)}
              </p>
            </div>
            <button type="button" onClick={() => setCup(randomCup())} className={`${btnQuiet} mt-3 w-full`}>
              ✦ surprise me
            </button>
          </div>

          <div className="space-y-5">
            <Group legend="cup">
              {keys(CUP_STYLES).map((s) => (
                <label key={s} className={`${option(cup.style === s)} grid w-20 place-items-center p-1.5`} title={CUP_STYLES[s].name}>
                  {radio("style", s, CUP_STYLES[s].name)}
                  <CupAvatar cup={{ ...cup, style: s }} className="h-14 w-auto" />
                  <span aria-hidden className="mt-0.5 text-center text-[0.7rem] leading-tight">
                    {CUP_STYLES[s].name.split(" (")[0]}
                  </span>
                </label>
              ))}
            </Group>

            <Group legend="what's inside">
              {keys(CUP_DRINKS).map((d) => (
                <label key={d} className={`${option(cup.drink === d)} flex items-center gap-1.5 px-2.5 py-1 text-sm`}>
                  {radio("drink", d, CUP_DRINKS[d].name)}
                  <span aria-hidden className="size-4 rounded-full border-2 border-cola/50" style={{ background: CUP_DRINKS[d].tint }} />
                  <span aria-hidden>
                    {CUP_DRINKS[d].name}
                    {CHAI.has(d) && " ☕"}
                  </span>
                </label>
              ))}
            </Group>

            <Group legend="colour">
              {keys(CUP_COLOURS).map((c) => (
                <label key={c} className={`${option(cup.colour === c)} p-1`} title={CUP_COLOURS[c].name}>
                  {radio("colour", c, CUP_COLOURS[c].name)}
                  <span
                    aria-hidden
                    className="block size-9 rounded-full border-2 border-cola/50"
                    style={{ background: `linear-gradient(135deg, ${CUP_COLOURS[c].body} 60%, ${CUP_COLOURS[c].ink} 60%)` }}
                  />
                </label>
              ))}
            </Group>

            <Group legend="design">
              {keys(CUP_PATTERNS).map((p) => (
                <label key={p} className={`${option(cup.pattern === p)} grid w-20 place-items-center p-1.5`} title={CUP_PATTERNS[p].name}>
                  {radio("pattern", p, CUP_PATTERNS[p].name)}
                  <CupAvatar cup={{ ...cup, pattern: p }} className="h-14 w-auto" />
                  <span aria-hidden className="mt-0.5 text-center text-[0.7rem] leading-tight">
                    {CUP_PATTERNS[p].name}
                  </span>
                </label>
              ))}
            </Group>
          </div>
        </div>
      </div>

      <FormMessage error={state.error} ok={state.ok && "Saved ✦"} />
      <button type="submit" disabled={pending} className={btn}>
        {pending ? "saving…" : submitLabel}
      </button>
    </form>
  );
}
