"use server";

import { headers } from "next/headers";
import { safeNext } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import type { FormState } from "./posts";

const PROD = "https://latteletters.vercel.app";
const ORIGINS = new Set([PROD, "http://localhost:3123"]);

/** Email a one-time login link (also creates the account on first use). */
export async function sendLoginLink(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { error: "That email doesn't look quite right." };

  const origin = (await headers()).get("origin") ?? "";
  const base = ORIGINS.has(origin) ? origin : PROD;
  const next = safeNext(form.get("next"));

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: `${base}/auth/confirm?next=${encodeURIComponent(next)}` },
  });
  if (error) {
    if (error.status === 429) return { error: "Too many login emails just now. Wait a minute and try again." };
    return { error: "Couldn't send the email. Please try again in a moment." };
  }
  return { ok: true, at: Date.now() };
}
