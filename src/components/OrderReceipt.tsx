/**
 * A go-to order as a torn till receipt: the one on the creator page, and on
 * every member's profile. Empty lines print as "________" like a blank form.
 */
import { Barcode } from "./CafeIdCard";

export type Order = {
  drink: string | null;
  size: string | null;
  milk: string | null;
  sweetness: string | null;
  temperature: string | null;
  extras: string | null;
  notes: string[];
};

/** Longest each line can be (the database checks these too, see migration 0009). */
export const ORDER_LIMITS = { drink: 120, size: 40, milk: 60, sweetness: 40, temperature: 40, extras: 120, note: 140, notes: 3 } as const;

const blank = (v: string | null) => v || "_______________";

export function OrderReceipt({ name, order, seed }: { name: string; order: Order; seed: string }) {
  const rows: [string, string | null][] = [
    ["Name", name],
    ["Drink", order.drink],
    ["Size", order.size],
    ["Milk", order.milk],
    ["Sweetness", order.sweetness],
    ["Temp", order.temperature],
    ["Extras", order.extras],
  ];
  return (
    <div className="receipt bg-[#f4f1ea] px-8 py-10 font-mono text-cola">
      <p className="text-center text-xl font-bold">Order!</p>
      <p className="text-center text-sm tracking-widest">CONFIRM AT THE COUNTER</p>

      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt>{k} :</dt>
            <dd className={`break-words ${v ? "font-bold" : "text-cola/40"}`}>{blank(v)}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 font-bold underline underline-offset-4">Notes</p>
      <ul className="mt-1 list-inside list-disc text-sm">
        {(order.notes.length ? order.notes : [null, null]).map((n, i) => (
          <li key={i} className={`break-words ${n ? "" : "text-cola/40"}`}>
            {blank(n)}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-center text-sm font-bold">
        Don&rsquo;t forget to tag the cafe
        <br />
        Thanks for your order
      </p>
      <Barcode seed={seed} className="mt-4 h-12 w-full" />
    </div>
  );
}
