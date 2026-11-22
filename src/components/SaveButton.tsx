"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { setSaved } from "@/app/actions/saved";

/**
 * ♡ save a cafe to your (private) list.
 * `saved === null` means logged out: the heart links to login instead.
 */
export function SaveButton({
  cafeId,
  cafeName,
  saved,
  variant = "sticker",
  className = "",
}: {
  cafeId: string;
  cafeName: string;
  saved: boolean | null;
  variant?: "sticker" | "pill";
  className?: string;
}) {
  const [confirmed, setConfirmed] = useState(!!saved);
  const [shown, setShown] = useOptimistic(confirmed);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();

  const look =
    variant === "pill"
      ? `inline-flex items-center gap-1.5 rounded-full border-2 border-cola px-4 py-1.5 font-display text-sm shadow-[2px_2px_0_var(--color-cola)] transition hover:-translate-y-0.5 ${shown ? "bg-hotpink" : "bg-lemon hover:bg-cotton-deep"}`
      : `grid size-8 place-items-center rounded-full border-2 border-cola text-base leading-none shadow-[1.5px_1.5px_0_var(--color-cola)] transition hover:scale-110 sm:size-9 sm:text-lg ${shown ? "bg-hotpink" : "bg-lemon"}`;
  const heart = <span aria-hidden className={shown ? "text-cola" : "text-cola/70"}>{shown ? "♥" : "♡"}</span>;
  const pillText = variant === "pill" && <span>{shown ? "saved" : "save to my list"}</span>;

  if (saved === null) {
    return (
      <Link href={`/login?next=${encodeURIComponent(`/cafe/${cafeId}`)}`} className={`${look} ${className}`} title="Log in to save cafes">
        {heart}
        {pillText}
        <span className="sr-only">Log in to save {cafeName}</span>
      </Link>
    );
  }

  return (
    <span className={className || "relative inline-block"}>
      <button
        type="button"
        aria-pressed={shown}
        title={shown ? "Saved to your list" : "Save to your list"}
        onClick={() =>
          startTransition(async () => {
            const want = !shown;
            setError(undefined);
            setShown(want);
            const res = await setSaved(cafeId, want);
            setConfirmed(res.saved);
            if (res.error) setError(res.error);
          })
        }
        className={look}
      >
        {heart}
        {pillText}
        <span className="sr-only">
          {variant === "pill" ? ` ${cafeName}` : `Save ${cafeName} to your list`}
        </span>
      </button>
      {error && (
        <span role="alert" className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border-2 border-cola bg-lemon px-2 py-1 text-xs">
          {error}
        </span>
      )}
    </span>
  );
}
