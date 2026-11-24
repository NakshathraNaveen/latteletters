"use client";

import { useSearchParams } from "next/navigation";

/** Shown once, right after someone adds a cafe (/cafe/c-…?added=1). */
export function AddedBanner({ name }: { name: string }) {
  const added = useSearchParams().get("added") === "1";
  if (!added) return null;
  return (
    <p role="status" className="mt-6 rounded-2xl border-2 border-cola bg-lime/80 px-5 py-3 font-hand text-2xl shadow-[3px_3px_0_var(--color-cola)]">
      ✦ {name} is on latteletters now, thank you! Write the first review below ↓
    </p>
  );
}
