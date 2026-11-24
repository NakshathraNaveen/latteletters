"use client";

import { useState, useTransition } from "react";
import { moderateCafe } from "@/app/actions/cafes";
import { btnQuiet } from "@/components/ui";

export function ModerateCafeButtons({ id, hidden }: { id: string; hidden: boolean }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string>();
  if (done) return <p role="status" className="font-semibold">{done}</p>;

  const run = (action: "approve" | "hide", label: string) =>
    start(async () => {
      const r = await moderateCafe(id, action);
      setDone(r.error ?? label);
    });

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={pending} className={btnQuiet} onClick={() => run("approve", "Approved: it's back on the map.")}>
        ✓ it&apos;s real, show it
      </button>
      {!hidden && (
        <button type="button" disabled={pending} className={btnQuiet} onClick={() => run("hide", "Hidden.")}>
          hide it
        </button>
      )}
    </div>
  );
}
