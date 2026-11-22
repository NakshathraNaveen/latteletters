"use client";

import { useActionState, useEffect, useOptimistic, useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { createCrew, inviteByUsername, renameCrew, setCrewHeart, type CrewState } from "@/app/actions/crews";
import { btn, btnQuiet, FormMessage, input, label } from "@/components/ui";

const noSubscribe = () => () => {};
const EMOJI = ["☕", "🧋", "🍵", "🥐", "🍰", "🧁", "🍩", "📚", "🌙", "🌿", "💌", "✨"];

/** A button that runs a (bound) server action, with an optional "are you sure?" step. */
export function ActionButton({
  action,
  children,
  confirm,
  className = btnQuiet,
  pendingLabel = "one sec…",
}: {
  action: () => Promise<CrewState>;
  children: ReactNode;
  confirm?: string;
  className?: string;
  pendingLabel?: string;
}) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<CrewState>({});
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        className={className}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => setState((await action()) ?? {}));
        }}
      >
        {pending ? pendingLabel : children}
      </button>
      {state.error && (
        <span role="alert" className="text-xs font-semibold">
          {state.error}
        </span>
      )}
    </span>
  );
}

function EmojiPicker({ name, initial = "☕" }: { name: string; initial?: string }) {
  return (
    <fieldset>
      <legend className={label}>pick a mascot</legend>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {EMOJI.map((e) => (
          <label
            key={e}
            className="grid size-10 cursor-pointer place-items-center rounded-xl border-2 border-transparent text-xl transition hover:border-cola/40 has-[:checked]:border-cola has-[:checked]:bg-lemon has-[:checked]:shadow-[2px_2px_0_var(--color-cola)] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-hotpink/60"
          >
            <input type="radio" name={name} value={e} defaultChecked={e === initial} className="sr-only" />
            <span aria-hidden>{e}</span>
            <span className="sr-only">{e}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CreateCrewForm() {
  const [state, action, pending] = useActionState<CrewState, FormData>(createCrew, {});
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="crew-name" className={label}>
          crew name
        </label>
        <input id="crew-name" name="name" required maxLength={40} placeholder="study buddies, matcha mafia…" className={input} />
      </div>
      <EmojiPicker name="emoji" />
      <FormMessage error={state.error} />
      <button type="submit" disabled={pending} className={btn}>
        {pending ? "starting…" : "start the crew ✦"}
      </button>
    </form>
  );
}

export function RenameCrewForm({ crewId, name, emoji }: { crewId: string; name: string; emoji: string }) {
  const [state, action, pending] = useActionState<CrewState, FormData>(renameCrew, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="crewId" value={crewId} />
      <div className="space-y-1.5">
        <label htmlFor="rename" className={label}>
          crew name
        </label>
        <input id="rename" name="name" required maxLength={40} defaultValue={name} className={input} />
      </div>
      <EmojiPicker name="emoji" initial={emoji} />
      <FormMessage error={state.error} ok={state.ok} />
      <button type="submit" disabled={pending} className={btnQuiet}>
        {pending ? "saving…" : "save"}
      </button>
    </form>
  );
}

export function InviteByUsername({ crewId }: { crewId: string }) {
  const [state, action, pending] = useActionState<CrewState, FormData>(inviteByUsername, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.at, state.ok]);
  return (
    <form ref={ref} action={action} className="space-y-2">
      <input type="hidden" name="crewId" value={crewId} />
      <label htmlFor="invite-username" className={label}>
        or add a friend by username
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 font-display">
            @
          </span>
          <input id="invite-username" name="username" required maxLength={21} autoComplete="off" placeholder="iced_latte_lover" className={`${input} pl-8`} />
        </div>
        <button type="submit" disabled={pending} className={btn}>
          {pending ? "…" : "invite"}
        </button>
      </div>
      <FormMessage error={state.error} ok={state.ok} />
    </form>
  );
}

export function CopyInviteLink({ code }: { code: string }) {
  const origin = useSyncExternalStore(noSubscribe, () => window.location.origin, () => "");
  const url = `${origin}/crews/join/${code}`;
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-2">
      <label htmlFor="invite-link" className={label}>
        share this invite link
      </label>
      <div className="flex gap-2">
        <input id="invite-link" readOnly value={url} onFocus={(e) => e.currentTarget.select()} className={`${input} font-mono text-xs sm:text-sm`} />
        <button
          type="button"
          className={btn}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            } catch {
              document.getElementById("invite-link")?.focus();
            }
          }}
        >
          {copied ? "copied ✓" : "copy"}
        </button>
      </div>
      <p className="text-xs text-cola/75" aria-live="polite">
        {copied ? "Copied! Text it to your friends ✦" : "Anyone with a latteletters account who has this link can join."}
      </p>
    </div>
  );
}

export function CrewHeart({ crewId, cafeId, cafeName, hearts, mine }: { crewId: string; cafeId: string; cafeName: string; hearts: number; mine: boolean }) {
  const [confirmed, setConfirmed] = useState({ on: mine, n: hearts });
  const [shown, setShown] = useOptimistic(confirmed);
  const [, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={shown.on}
      onClick={() =>
        start(async () => {
          const on = !shown.on;
          const next = { on, n: shown.n + (on ? 1 : -1) };
          setShown(next);
          const res = await setCrewHeart(crewId, cafeId, on);
          setConfirmed(res.error ? confirmed : next);
        })
      }
      className={`relative z-10 inline-flex items-center gap-1 rounded-full border-2 border-cola px-2.5 py-0.5 text-sm font-semibold transition hover:-translate-y-0.5 ${shown.on ? "bg-hotpink" : "bg-lemon"}`}
    >
      <span aria-hidden>{shown.on ? "♥" : "♡"}</span> {shown.n}
      <span className="sr-only"> hearts. Heart {cafeName}</span>
    </button>
  );
}
