"use client";

import { useState, useTransition } from "react";
import { deleteList } from "@/app/actions/lists";
import { btnQuiet } from "@/components/ui";

/** Two-step delete (no browser confirm dialog). */
export function DeleteListButton({ listId }: { listId: string }) {
  const [sure, setSure] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-3">
      {sure ? (
        <>
          <span className="text-sm font-semibold">Delete this list for good?</span>
          <button
            type="button"
            disabled={pending}
            className={btnQuiet}
            onClick={() =>
              start(async () => {
                const r = await deleteList(listId);
                if (r?.error) setError(r.error);
              })
            }
          >
            {pending ? "deleting…" : "yes, delete it"}
          </button>
          <button type="button" className="text-sm underline" onClick={() => setSure(false)}>
            keep it
          </button>
        </>
      ) : (
        <button type="button" className="text-sm font-semibold underline underline-offset-4" onClick={() => setSure(true)}>
          delete this list
        </button>
      )}
      {error && <p role="alert" className="text-sm font-semibold">{error}</p>}
    </div>
  );
}
