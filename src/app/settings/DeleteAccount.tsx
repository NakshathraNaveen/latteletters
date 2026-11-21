"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/posts";
import { deleteAccount } from "@/app/actions/profile";
import { FormMessage, input, label } from "@/components/ui";

export function DeleteAccount({ username }: { username: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteAccount, {});
  return (
    <form action={action} className="space-y-3">
      <p>
        This permanently deletes your account, every review and love note you&rsquo;ve posted, and all your photos. It can&rsquo;t be
        undone.
      </p>
      <label htmlFor="confirm" className={label}>
        type <span className="normal-case tracking-normal">{username}</span> to confirm
      </label>
      <input id="confirm" name="confirm" autoComplete="off" required className={input} />
      <FormMessage error={state.error} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border-2 border-cola bg-cola px-5 py-2 font-display font-bold text-cotton transition hover:bg-ink disabled:opacity-60"
      >
        {pending ? "deleting…" : "delete my account"}
      </button>
    </form>
  );
}
