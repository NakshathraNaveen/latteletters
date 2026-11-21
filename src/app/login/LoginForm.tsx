"use client";

import { useActionState } from "react";
import { sendLoginLink } from "@/app/actions/login";
import type { FormState } from "@/app/actions/posts";
import { btn, FormMessage, input, label } from "@/components/ui";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendLoginLink, {});

  if (state.ok)
    return (
      <div role="status" className="paper relative rotate-1 bg-lemon p-6 shadow-[var(--shadow-paper)]">
        <span className="tape -top-3 left-1/2 -translate-x-1/2 -rotate-3" />
        <p className="font-display text-3xl">check your inbox ✉︎</p>
        <p className="mt-2">
          We sent you a login link. Open it on this device and you&rsquo;re in. It can take a minute, and sometimes hides in spam.
        </p>
      </div>
    );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-1.5">
        <label htmlFor="email" className={label}>
          your email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" className={input} />
      </div>
      <FormMessage error={state.error} />
      <button type="submit" disabled={pending} className={btn}>
        {pending ? "sending…" : "email me a login link"}
      </button>
      <p className="text-sm text-cola/80">
        No passwords. New here? The same link creates your account. We only use your email to log you in (see our{" "}
        <a href="/privacy" className="underline underline-offset-4">
          privacy notes
        </a>
        ).
      </p>
    </form>
  );
}
