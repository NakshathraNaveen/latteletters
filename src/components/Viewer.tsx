"use client";

import { createContext, use, type ReactNode } from "react";
import type { Viewer } from "@/lib/auth";

const ViewerContext = createContext<Promise<Viewer> | null>(null);

/** Hands the (not yet awaited) logged-in user to client components below. */
export function ViewerProvider({ viewer, children }: { viewer: Promise<Viewer>; children: ReactNode }) {
  return <ViewerContext value={viewer}>{children}</ViewerContext>;
}

/** Suspends until the session has been read; wrap callers in <Suspense>. */
export function useViewer(): Viewer {
  const promise = use(ViewerContext);
  return promise ? use(promise) : null;
}
