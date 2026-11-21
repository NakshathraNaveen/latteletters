import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { UserAvatar } from "./CupAvatar";

const pill =
  "inline-flex items-center gap-1.5 rounded-full border-2 border-cola bg-lemon px-3 py-1 font-label text-[11px] uppercase tracking-wider shadow-[2px_2px_0_var(--color-cola)] transition hover:bg-hotpink";

/** Header login state. Reads the session, so it must render inside <Suspense>. */
export async function AccountButton() {
  const user = await getCurrentUser();
  if (!user) return <LoginLink />;
  if (!user.profile)
    return (
      <Link href="/welcome" className={pill}>
        finish signing up
      </Link>
    );
  return (
    <Link href="/settings" className={pill} aria-label={`Your account, @${user.profile.username}`}>
      <UserAvatar avatar={user.profile.avatar} className="h-5 w-auto" />
      <span className="max-w-24 truncate normal-case tracking-normal">@{user.profile.username}</span>
    </Link>
  );
}

export function LoginLink() {
  return (
    <Link href="/login" className={pill}>
      log in
    </Link>
  );
}
