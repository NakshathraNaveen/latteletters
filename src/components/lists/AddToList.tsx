"use client";

/**
 * "☆ add to a list" on cafe pages: pick one of your lists (or start a new
 * one) and say what to order there. `lists === null` means logged out.
 */
import Link from "next/link";
import { useActionState, useId, useRef, useState, useTransition } from "react";
import { addCafeToList, createList, type ListState } from "@/app/actions/lists";
import { LIST_LIMITS } from "@/lib/list-constants";
import { input, label } from "@/components/ui";

const pill =
  "inline-flex items-center gap-1.5 rounded-full border-2 border-cola bg-lemon px-4 py-1.5 font-display text-sm shadow-[2px_2px_0_var(--color-cola)] transition hover:-translate-y-0.5 hover:bg-cotton-deep";

type ListOption = { id: string; title: string; emoji: string; isPublic: boolean; has: boolean };

export function AddToList({ cafeId, cafeName, lists }: { cafeId: string; cafeName: string; lists: ListOption[] | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [added, setAdded] = useState<Set<string>>(() => new Set(lists?.filter((l) => l.has).map((l) => l.id)));
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [recommend, setRecommend] = useState("");
  const [note, setNote] = useState("");
  const [making, setMaking] = useState(false);
  const [, start] = useTransition();
  const [created, createAction, creating] = useActionState<ListState, FormData>(async (s, f) => {
    const r = await createList(s, f);
    if (r.ok) setMaking(false);
    return r;
  }, {});

  if (lists === null) {
    return (
      <Link href={`/login?next=${encodeURIComponent(`/cafe/${cafeId}`)}`} className={pill}>
        <span aria-hidden>☆</span> add to a list<span className="sr-only"> (log in first)</span>
      </Link>
    );
  }

  const newList = created.ok ? { id: created.ok, title: "your new list", emoji: "✦", isPublic: false, has: true } : null;
  const all = newList && !lists.some((l) => l.id === newList.id) ? [newList, ...lists] : lists;

  return (
    <>
      <button type="button" className={pill} onClick={() => dialog.current?.showModal()} aria-haspopup="dialog">
        <span aria-hidden>☆</span> add to a list
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={`${id}-title`}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-3xl border-2 border-cola bg-cotton p-0 text-cola shadow-[var(--shadow-lift)] backdrop:bg-cola/40"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <div className="paper max-h-[85vh] overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id={`${id}-title`} className="font-display text-2xl leading-tight">
              add {cafeName} to a list
            </h2>
            <button type="button" onClick={() => dialog.current?.close()} className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-cola bg-lemon font-bold" aria-label="Close">
              ×
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor={`${id}-rec`} className={label}>
                what should people order? <span className="normal-case tracking-normal text-cola/60">(optional)</span>
              </label>
              <input
                id={`${id}-rec`}
                value={recommend}
                onChange={(e) => setRecommend(e.target.value)}
                maxLength={LIST_LIMITS.recommendMax}
                placeholder="the pistachio latte + a cardamom bun"
                className={`${input} mt-1.5`}
              />
            </div>
            <div>
              <label htmlFor={`${id}-note`} className={label}>
                a note <span className="normal-case tracking-normal text-cola/60">(optional)</span>
              </label>
              <input
                id={`${id}-note`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={LIST_LIMITS.noteMax}
                placeholder="grab the window seat"
                className={`${input} mt-1.5 font-note text-lg`}
              />
            </div>
          </div>

          {all.length > 0 && (
            <ul className="mt-5 space-y-2">
              {all.map((l) => {
                const isIn = added.has(l.id) || l.has;
                return (
                  <li key={l.id} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-cola/30 bg-lemon/70 px-3 py-2">
                    <span className="min-w-0 truncate font-semibold">
                      <span aria-hidden>{l.emoji}</span> {l.title}{" "}
                      <span className="text-xs font-normal">{l.isPublic ? "· public" : "· 🔒 private"}</span>
                    </span>
                    {isIn ? (
                      <span className="shrink-0 text-sm font-semibold">✓ added</span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy === l.id}
                        className="shrink-0 rounded-full border-2 border-cola bg-hotpink px-3 py-1 text-sm font-bold transition hover:bg-cola hover:text-cotton disabled:opacity-60"
                        onClick={() =>
                          start(async () => {
                            setBusy(l.id);
                            setError(undefined);
                            const res = await addCafeToList(l.id, cafeId, recommend, note);
                            setBusy(undefined);
                            if (res.error && !/already on/.test(res.error)) return setError(res.error);
                            setAdded((s) => new Set(s).add(l.id));
                          })
                        }
                      >
                        {busy === l.id ? "adding…" : "add"}
                        <span className="sr-only"> to {l.title}</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {making ? (
            <form action={createAction} className="mt-5 space-y-2 rounded-2xl border-2 border-dashed border-cola/60 p-4">
              <input type="hidden" name="cafeId" value={cafeId} />
              <input type="hidden" name="recommend" value={recommend} />
              <input type="hidden" name="note" value={note} />
              <label htmlFor={`${id}-new`} className={label}>
                new list name
              </label>
              <input id={`${id}-new`} name="title" required maxLength={LIST_LIMITS.titleMax} placeholder="date-night cafes" className={input} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isPublic" className="size-4 accent-[var(--color-hotpink)]" /> make it public
              </label>
              <button type="submit" disabled={creating} className="rounded-full border-2 border-cola bg-hotpink px-4 py-1.5 text-sm font-bold disabled:opacity-60">
                {creating ? "making…" : "make list & add"}
              </button>
            </form>
          ) : (
            <button type="button" onClick={() => setMaking(true)} className="mt-4 text-sm font-semibold underline underline-offset-4">
              ＋ start a new list
            </button>
          )}

          {(error || created.error) && (
            <p role="alert" className="mt-3 rounded-2xl border-2 border-cola bg-cotton-deep px-4 py-2 text-sm font-semibold">
              {error || created.error}
            </p>
          )}
          <p className="mt-4 text-xs text-cola/75">
            Public lists show on your profile and on cafe pages.{" "}
            <Link href="/lists" className="underline">
              manage your lists
            </Link>
          </p>
        </div>
      </dialog>
    </>
  );
}
