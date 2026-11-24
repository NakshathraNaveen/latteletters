"use client";

/** Name, emoji, description and public/private for a cafe list (create or edit). */
import { useActionState, useState } from "react";
import type { ListState } from "@/app/actions/lists";
import { LIST_EMOJI, LIST_LIMITS } from "@/lib/list-constants";
import { btn, FormMessage, input, label } from "@/components/ui";

type Details = { title: string; description: string | null; emoji: string; isPublic: boolean };

export function ListDetailsForm({
  action,
  initial,
  submitLabel,
}: {
  action: (state: ListState, form: FormData) => Promise<ListState>;
  initial?: Details;
  submitLabel: string;
}) {
  const [state, formAction, saving] = useActionState<ListState, FormData>(action, {});
  const [emoji, setEmoji] = useState(initial?.emoji ?? "☕");
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? false);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="list-title" className={label}>
          list name
        </label>
        <input id="list-title" name="title" required maxLength={LIST_LIMITS.titleMax} defaultValue={initial?.title} placeholder="best study spots in Toronto" className={`${input} mt-1.5`} />
      </div>
      <fieldset>
        <legend className={label}>sticker</legend>
        <input type="hidden" name="emoji" value={emoji} />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {LIST_EMOJI.map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={emoji === e}
              aria-label={e}
              onClick={() => setEmoji(e)}
              className={`grid size-10 place-items-center rounded-full border-2 text-xl transition ${emoji === e ? "border-cola bg-hotpink" : "border-cola/30 bg-lemon hover:border-cola"}`}
            >
              {e}
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="list-description" className={label}>
          what&apos;s it for? <span className="normal-case tracking-normal text-cola/60">(optional)</span>
        </label>
        <textarea
          id="list-description"
          name="description"
          rows={2}
          maxLength={LIST_LIMITS.descriptionMax}
          defaultValue={initial?.description ?? ""}
          placeholder="quiet, good wifi, open late. tested during finals."
          className={`${input} mt-1.5`}
        />
      </div>
      <fieldset>
        <legend className={label}>who can see it?</legend>
        <input type="hidden" name="isPublic" value={isPublic ? "true" : "false"} />
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { value: false, title: "🔒 just me", hint: "private" },
            { value: true, title: "✦ everyone", hint: "on your profile and cafe pages" },
          ].map((o) => (
            <button
              key={String(o.value)}
              type="button"
              aria-pressed={isPublic === o.value}
              onClick={() => setIsPublic(o.value)}
              className={`rounded-2xl border-2 border-cola px-4 py-2 text-left transition ${isPublic === o.value ? "bg-hotpink shadow-[2px_2px_0_var(--color-cola)]" : "bg-lemon hover:bg-cotton-deep"}`}
            >
              <span className="block font-semibold">{o.title}</span>
              <span className="block text-xs">{o.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <FormMessage error={state.error} ok={state.ok} />
      <button type="submit" disabled={saving} className={btn}>
        {saving ? "saving…" : submitLabel}
      </button>
    </form>
  );
}
