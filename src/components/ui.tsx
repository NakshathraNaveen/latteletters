/** Shared form styling so every account/review form looks like the rest of the scrapbook. */

export const btn =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-cola bg-hotpink px-6 py-2.5 font-display font-bold text-cola shadow-[3px_3px_0_var(--color-cola)] transition hover:-translate-y-0.5 hover:bg-cola hover:text-cotton disabled:pointer-events-none disabled:opacity-60";

export const btnQuiet =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-cola bg-lemon px-4 py-1.5 text-sm font-semibold text-cola transition hover:bg-cola hover:text-cotton disabled:opacity-60";

export const input =
  "w-full rounded-2xl border-2 border-cola bg-lemon px-4 py-2.5 text-cola shadow-[2px_2px_0_var(--color-cola)] placeholder:text-cola/50 focus:outline-none focus-visible:ring-4 focus-visible:ring-hotpink/60";

export const label = "font-label text-xs uppercase tracking-[0.18em]";

export function FormMessage({ error, ok }: { error?: string; ok?: string | false }) {
  if (error)
    return (
      <p role="alert" className="rounded-2xl border-2 border-cola bg-cotton-deep px-4 py-2 font-semibold">
        {error}
      </p>
    );
  if (ok)
    return (
      <p role="status" className="rounded-2xl border-2 border-cola bg-lime/70 px-4 py-2 font-semibold">
        {ok}
      </p>
    );
  return null;
}
