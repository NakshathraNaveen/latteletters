"use client";

import { useState, useTransition } from "react";
import { reportCafe } from "@/app/actions/cafes";

/** "This isn't a real cafe" for community-added cafes. Three reports hide it until an admin checks. */
export function ReportCafeButton({ cafeId }: { cafeId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string>();
  const [pending, start] = useTransition();

  if (msg) return <p role="status" className="text-sm font-semibold">{msg}</p>;
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold underline underline-offset-4">
        report this listing
      </button>
    );
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await reportCafe(cafeId, reason);
          setMsg(r.error ?? "Thanks, we'll take a look ♡");
        });
      }}
    >
      <label htmlFor="report-reason" className="sr-only">
        What&apos;s wrong with this listing?
      </label>
      <input
        id="report-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={300}
        placeholder="what's wrong? (not real, closed, spam…)"
        className="min-w-0 flex-1 rounded-full border-2 border-cola bg-lemon px-3 py-1 text-sm"
      />
      <button type="submit" disabled={pending} className="rounded-full border-2 border-cola bg-hotpink px-3 py-1 text-sm font-semibold disabled:opacity-60">
        {pending ? "sending…" : "send report"}
      </button>
    </form>
  );
}
