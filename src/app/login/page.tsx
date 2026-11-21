import type { Metadata } from "next";
import { Suspense } from "react";
import { DrinkCup } from "@/components/DrinkCup";
import { Sparkle } from "@/components/decor";
import { safeNext } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <div className="mx-auto grid max-w-4xl items-center gap-10 px-5 py-16 md:grid-cols-[1fr_1.1fr]">
      <div className="relative mx-auto w-48 md:w-64">
        <DrinkCup drink="iced-latte" className="h-auto w-full -rotate-6" />
        <Sparkle size={34} color="var(--color-hotpink)" className="absolute -right-2 top-4 animate-twinkle" />
      </div>
      <div>
        <p className="font-serif text-2xl italic">come on in</p>
        <h1 className="font-display text-5xl font-extrabold tracking-tighter md:text-6xl">log in</h1>
        <p className="mb-6 mt-2 max-w-md">Pin love notes, review cafes and build your profile.</p>
        <Suspense fallback={<LoginForm next="/" />}>
          <WithNext searchParams={props.searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function WithNext({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { next, expired } = await searchParams;
  return (
    <>
      {expired && (
        <p role="alert" className="mb-4 rounded-2xl border-2 border-cola bg-cotton-deep px-4 py-2 font-semibold">
          That login link has expired or was already used. Ask for a fresh one below.
        </p>
      )}
      <LoginForm next={safeNext(next)} />
    </>
  );
}
