"use client";

/** Settings: write your go-to order and watch the receipt print as you type. */
import { useActionState, useState } from "react";
import { saveGoToOrder, type OrderState } from "@/app/actions/orders";
import { ORDER_LIMITS, OrderReceipt, type Order } from "./OrderReceipt";
import { btn, FormMessage, input, label } from "./ui";

const LINES = [
  { key: "drink", label: "drink", placeholder: "iced brown sugar oat latte" },
  { key: "size", label: "size", placeholder: "medium" },
  { key: "milk", label: "milk", placeholder: "oat" },
  { key: "sweetness", label: "sweetness", placeholder: "half sweet" },
  { key: "temperature", label: "temp", placeholder: "iced, light ice" },
  { key: "extras", label: "extras", placeholder: "extra shot, cinnamon on top" },
] as const;

const EMPTY: Order = { drink: null, size: null, milk: null, sweetness: null, temperature: null, extras: null, notes: [] };

export function GoToOrderForm({ username, initial }: { username: string; initial: Order | null }) {
  const [state, action, saving] = useActionState<OrderState, FormData>(saveGoToOrder, {});
  const [order, setOrder] = useState<Order>(initial ?? EMPTY);
  const [notes, setNotes] = useState<string[]>(() => {
    const n = [...(initial?.notes ?? [])];
    while (n.length < ORDER_LIMITS.notes) n.push("");
    return n;
  });
  const preview: Order = { ...order, notes: notes.map((n) => n.trim()).filter(Boolean) };

  return (
    <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <form action={action} className="space-y-4">
        {LINES.map((l) => (
          <div key={l.key}>
            <label htmlFor={`order-${l.key}`} className={label}>
              {l.label}
            </label>
            <input
              id={`order-${l.key}`}
              name={l.key}
              maxLength={ORDER_LIMITS[l.key]}
              value={order[l.key] ?? ""}
              onChange={(e) => setOrder({ ...order, [l.key]: e.target.value || null })}
              placeholder={l.placeholder}
              className={`${input} mt-1.5`}
            />
          </div>
        ))}
        <fieldset>
          <legend className={label}>notes (up to {ORDER_LIMITS.notes})</legend>
          <div className="mt-1.5 space-y-2">
            {notes.map((n, i) => (
              <input
                key={i}
                name="note"
                aria-label={`Note ${i + 1}`}
                maxLength={ORDER_LIMITS.note}
                value={n}
                onChange={(e) => setNotes(notes.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder={i === 0 ? "pairs so good with a cream cheese bagel!!" : ""}
                className={input}
              />
            ))}
          </div>
        </fieldset>
        <FormMessage error={state.error} ok={state.ok} />
        <button type="submit" disabled={saving} className={btn}>
          {saving ? "printing…" : "save my order"}
        </button>
      </form>

      <div aria-hidden className="rotate-1 drop-shadow-[0_14px_18px_rgb(71_19_28/0.25)] md:sticky md:top-28">
        <OrderReceipt name={`@${username}`} order={preview} seed={`order-${username}`} />
      </div>
    </div>
  );
}
