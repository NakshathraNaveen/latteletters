import Link from "next/link";
import { DrinkCup } from "@/components/DrinkCup";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center">
      <DrinkCup drink="cold-brew" className="h-48 w-auto rotate-12" />
      <h1 className="mt-6 font-display text-6xl font-extrabold tracking-tighter">spilled it.</h1>
      <p className="mt-3 text-lg">We couldn&rsquo;t find that page. Maybe it was a limited-edition drink?</p>
      <Link
        href="/"
        className="mt-8 rounded-full border-2 border-cola bg-hotpink px-6 py-3 font-display font-bold shadow-[3px_3px_0_var(--color-cola)]"
      >
        take me home
      </Link>
    </div>
  );
}
