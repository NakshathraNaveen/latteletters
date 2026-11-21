import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { cache } from "react";
import { supabaseAdmin } from "./supabase/admin";
import { supabaseServer } from "./supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
  /** null until they've picked one on /welcome */
  profile: { username: string; avatar: string; isAdmin: boolean } | null;
};

/**
 * Data access layer: the one place that reads the login session.
 * Reads cookies, so callers must sit inside a <Suspense> boundary.
 * `cache` dedupes it within a single request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // per-visitor and time-dependent (token expiry): never part of a prerender or prefetch
  await connection();
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (!sub) return null;
  const { data: p } = await supabaseAdmin().from("profiles").select("username, avatar, is_admin").eq("id", sub).maybeSingle();
  return {
    id: sub,
    email: (data.claims.email as string | undefined) ?? null,
    profile: p ? { username: p.username, avatar: p.avatar, isAdmin: p.is_admin } : null,
  };
});

/** Logged in (or redirect to /login, coming back to `next` afterwards). */
export async function requireUser(next = "/") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Logged in *and* has a username. */
export async function requireProfile(next = "/") {
  const user = await requireUser(next);
  if (!user.profile) redirect(`/welcome?next=${encodeURIComponent(next)}`);
  return user as CurrentUser & { profile: NonNullable<CurrentUser["profile"]> };
}

/** Only allow same-site relative redirects (no open redirects). */
export function safeNext(next: unknown, fallback = "/") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

/** The small, serialisable slice of the user that client components need. */
export type Viewer = { id: string; username: string | null; isAdmin: boolean } | null;

export async function getViewer(): Promise<Viewer> {
  const user = await getCurrentUser();
  return user ? { id: user.id, username: user.profile?.username ?? null, isAdmin: user.profile?.isAdmin ?? false } : null;
}
