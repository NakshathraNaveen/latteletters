"use client";

import Link from "next/link";
import { useId, useRef, useState, useTransition } from "react";
import { addCafeToCrew } from "@/app/actions/crews";
import { input, label } from "@/components/ui";

const pill =
  "inline-flex items-center gap-1.5 rounded-full border-2 border-cola bg-lemon px-4 py-1.5 font-display text-sm shadow-[2px_2px_0_var(--color-cola)] transition hover:-translate-y-0.5 hover:bg-cotton-deep";

type CrewOption = { id: string; name: string; emoji: string; has: boolean };

/**
 * "＋ add to a crew" on cafe pages. `crews === null` means logged out.
 */
export function AddToCrew({ cafeId, cafeName, crews }: { cafeId: string; cafeName: string; crews: CrewOption[] | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [added, setAdded] = useState<Set<string>>(() => new Set(crews?.filter((c) => c.has).map((c) => c.id)));
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [note, setNote] = useState("");
  const [, start] = useTransition();

  if (crews === null) {
    return (
      <Link href={`/login?next=${encodeURIComponent(`/cafe/${cafeId}`)}`} className={pill}>
        <span aria-hidden>＋</span> add to a crew<span className="sr-only"> (log in first)</span>
      </Link>
    );
  }

  return (
    <>
      <button type="button" className={pill} onClick={() => dialog.current?.showModal()} aria-haspopup="dialog">
        <span aria-hidden>＋</span> add to a crew
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={`${id}-title`}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-3xl border-2 border-cola bg-cotton p-0 text-cola shadow-[var(--shadow-lift)] backdrop:bg-cola/40"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <div className="paper p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id={`${id}-title`} className="font-display text-2xl leading-tight">
              share {cafeName} with a crew
            </h2>
            <button type="button" onClick={() => dialog.current?.close()} className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-cola bg-lemon font-bold" aria-label="Close">
              ×
            </button>
          </div>

          {crews.length === 0 ? (
            <p className="mt-4">
              You&rsquo;re not in a crew yet.{" "}
              <Link href="/crews" className="font-semibold underline underline-offset-4">
                start one or join your friends →
              </Link>
            </p>
          ) : (
            <>
              <div className="mt-4 space-y-1.5">
                <label htmlFor={`${id}-note`} className={label}>
                  a little note <span className="normal-case tracking-normal text-cola/60">(optional)</span>
                </label>
                <input
                  id={`${id}-note`}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={140}
                  placeholder="the matcha here!! we have to go"
                  className={`${input} font-note text-lg`}
                />
              </div>
              <ul className="mt-4 space-y-2">
                {crews.map((c) => {
                  const isIn = added.has(c.id);
                  return (
                    <li key={c.id} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-cola/30 bg-lemon/70 px-3 py-2">
                      <span className="min-w-0 truncate font-semibold">
                        <span aria-hidden>{c.emoji}</span> {c.name}
                      </span>
                      {isIn ? (
                        <span className="shrink-0 text-sm font-semibold">✓ on the list</span>
                      ) : (
                        <button
                          type="button"
                          disabled={busy === c.id}
                          className="shrink-0 rounded-full border-2 border-cola bg-hotpink px-3 py-1 text-sm font-bold transition hover:bg-cola hover:text-cotton disabled:opacity-60"
                          onClick={() =>
                            start(async () => {
                              setBusy(c.id);
                              setError(undefined);
                              const res = await addCafeToCrew(c.id, cafeId, note);
                              setBusy(undefined);
                              if (res.error && !/already on/.test(res.error)) return setError(res.error);
                              setAdded((s) => new Set(s).add(c.id));
                            })
                          }
                        >
                          {busy === c.id ? "adding…" : "add"}
                          <span className="sr-only"> to {c.name}</span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
              {error && (
                <p role="alert" className="mt-3 rounded-2xl border-2 border-cola bg-cotton-deep px-4 py-2 text-sm font-semibold">
                  {error}
                </p>
              )}
              <p className="mt-4 text-xs text-cola/75">Only people in the crew can see its list and notes.</p>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
