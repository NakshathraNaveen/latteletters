"use client";

/** The list owner's controls on one cafe: edit what to order / the note, or take it off. */
import { useState, useTransition } from "react";
import { removeFromList, updateListItem } from "@/app/actions/lists";
import { LIST_LIMITS } from "@/lib/list-constants";
import { input } from "@/components/ui";

export function ListItemControls({ listId, cafeId, recommend, note }: { listId: string; cafeId: string; recommend: string | null; note: string | null }) {
  const [editing, setEditing] = useState(false);
  const [rec, setRec] = useState(recommend ?? "");
  const [n, setN] = useState(note ?? "");
  const [msg, setMsg] = useState<string>();
  const [pending, start] = useTransition();

  if (msg === "Removed.") return <p className="mt-2 text-sm font-semibold">Removed from the list.</p>;

  return (
    <div className="mt-3">
      {editing ? (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await updateListItem(listId, cafeId, rec, n);
              setMsg(r.error ?? r.ok);
              if (!r.error) setEditing(false);
            });
          }}
        >
          <input aria-label="What to order" value={rec} onChange={(e) => setRec(e.target.value)} maxLength={LIST_LIMITS.recommendMax} placeholder="what to order" className={`${input} py-1.5 text-sm`} />
          <input aria-label="Note" value={n} onChange={(e) => setN(e.target.value)} maxLength={LIST_LIMITS.noteMax} placeholder="a note" className={`${input} py-1.5 text-sm`} />
          <div className="flex gap-3 text-sm font-semibold">
            <button type="submit" disabled={pending} className="underline underline-offset-4">
              {pending ? "saving…" : "save"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="underline underline-offset-4">
              cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex gap-4 text-sm font-semibold">
          <button type="button" onClick={() => setEditing(true)} className="underline underline-offset-4">
            edit
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await removeFromList(listId, cafeId);
                setMsg(r.error ?? r.ok);
              })
            }
            className="underline underline-offset-4"
          >
            remove
          </button>
        </div>
      )}
      {msg && msg !== "Removed." && (
        <p role="status" className="mt-1 text-sm">
          {msg}
        </p>
      )}
    </div>
  );
}
