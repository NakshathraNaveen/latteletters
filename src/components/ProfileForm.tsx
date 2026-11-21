"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/actions/posts";
import { saveProfile } from "@/app/actions/profile";
import { DRINKS, DRINK_IDS } from "@/lib/drinks";
import { DrinkCup } from "./DrinkCup";
import { btn, FormMessage, input, label } from "./ui";

/** Username + drink-cup avatar picker (used on /welcome and /settings). */
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
  const [avatar, setAvatar] = useState(initial?.avatar ?? "iced-latte");

  return (
    <form action={action} className="space-y-6">
      {next !== undefined && <input type="hidden" name="next" value={next} />}
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

      <fieldset>
        <legend className={label}>pick your cup</legend>
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {DRINK_IDS.map((d) => (
            <label
              key={d}
              className={`grid cursor-pointer place-items-center rounded-2xl border-2 p-2 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-hotpink/60 ${
                avatar === d ? "border-cola bg-lemon shadow-[2px_2px_0_var(--color-cola)]" : "border-transparent hover:border-cola/40"
              }`}
              title={DRINKS[d].name}
            >
              <input type="radio" name="avatar" value={d} checked={avatar === d} onChange={() => setAvatar(d)} className="sr-only" />
              <DrinkCup drink={d} className="h-14 w-auto" />
              <span className="sr-only">{DRINKS[d].name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <FormMessage error={state.error} ok={state.ok && "Saved ✦"} />
      <button type="submit" disabled={pending} className={btn}>
        {pending ? "saving…" : submitLabel}
      </button>
    </form>
  );
}
