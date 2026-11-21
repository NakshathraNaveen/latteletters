"use client";

import { useState, useTransition } from "react";
import { moderate } from "@/app/actions/admin";
import { btnQuiet } from "@/components/ui";

export function ModerateButtons({ id, hidden }: { id: string; hidden: boolean }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string>();
  if (done) return <p role="status" className="font-semibold">{done}</p>;

  const run = (action: "approve" | "hide" | "delete", label: string) =>
    start(async () => {
      if (action === "delete" && !confirm("Delete this post and its photos for good?")) return;
      const r = await moderate(id, action);
      setDone(r.error ?? label);
    });

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={pending} className={btnQuiet} onClick={() => run("approve", "Approved: back on the wall.")}>
        ✓ looks fine, show it
      </button>
      {!hidden && (
        <button type="button" disabled={pending} className={btnQuiet} onClick={() => run("hide", "Hidden.")}>
          hide
        </button>
      )}
      <button type="button" disabled={pending} className={btnQuiet} onClick={() => run("delete", "Deleted.")}>
        delete
      </button>
    </div>
  );
}
