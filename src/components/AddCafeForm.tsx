"use client";

/**
 * Add a cafe that isn't on the map: name, kind, where it is (search, "use my
 * location", then drag the pin), and optionally the street and Instagram.
 * On success the server sends you to the new cafe's page to write a review.
 */
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { addCafe, lookupPlace, type AddCafeState } from "@/app/actions/cafes";
import { CAFE_KINDS, type CafeKind } from "@/lib/cafe-kinds";
import { btn, btnQuiet, FormMessage, input, label } from "./ui";
import { PinPicker, type LatLng } from "./maps/PinPicker";

const WORLD = { lat: 30, lng: 0, zoom: 1.4 };

export function AddCafeForm({ defaultName = "" }: { defaultName?: string }) {
  const [state, action, saving] = useActionState<AddCafeState, FormData>(addCafe, {});
  const [name, setName] = useState(defaultName);
  const [kind, setKind] = useState<CafeKind>("coffee");
  const [street, setStreet] = useState("");
  const [instagram, setInstagram] = useState("");
  const [where, setWhere] = useState("");
  const [centre, setCentre] = useState(WORLD);
  const [pin, setPin] = useState<LatLng | null>(null);
  const [placeMsg, setPlaceMsg] = useState<string>();
  const [finding, startFinding] = useTransition();
  const [confirmNew, setConfirmNew] = useState(false);

  function findPlace() {
    setPlaceMsg(undefined);
    startFinding(async () => {
      const r = await lookupPlace(where);
      if ("error" in r) return setPlaceMsg(r.error);
      setCentre({ lat: r.lat, lng: r.lng, zoom: 17 });
      setPin({ lat: r.lat, lng: r.lng });
      setPlaceMsg(`found ${r.label}. Now drag the cup onto the cafe.`);
    });
  }

  function myLocation() {
    if (!("geolocation" in navigator)) return setPlaceMsg("Your browser can't share location. Search for the street instead.");
    setPlaceMsg("finding you…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const p = { lat: coords.latitude, lng: coords.longitude };
        setCentre({ ...p, zoom: 17 });
        setPin(p);
        setPlaceMsg("pinned where you are. Drag the cup if the cafe is a few doors away.");
      },
      () => setPlaceMsg("Location is off. Search for the street or city instead."),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return (
    <form action={action} className="space-y-8">
      <div>
        <label htmlFor="cafe-name" className={label}>
          cafe name
        </label>
        <input id="cafe-name" name="name" required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={`${input} mt-2`} placeholder="e.g. Little Bean Coffee" />
      </div>

      <fieldset>
        <legend className={label}>what kind of spot?</legend>
        <input type="hidden" name="kind" value={kind} />
        <div className="mt-3 flex flex-wrap gap-2">
          {CAFE_KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              aria-pressed={kind === k.value}
              onClick={() => setKind(k.value)}
              className={`rounded-full border-2 border-cola px-4 py-1.5 text-sm font-semibold transition ${kind === k.value ? "bg-hotpink shadow-[2px_2px_0_var(--color-cola)]" : "bg-lemon hover:bg-cotton-deep"}`}
            >
              <span aria-hidden>{k.emoji}</span> {k.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={label}>where is it?</legend>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="cafe-where" className="sr-only">
            Search for the street or city
          </label>
          <input
            id="cafe-where"
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                findPlace();
              }
            }}
            className={input}
            placeholder="street, area or city: 12 King St W, Toronto"
          />
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={findPlace} disabled={finding || where.trim().length < 2} className={btnQuiet}>
              {finding ? "looking…" : "find"}
            </button>
            <button type="button" onClick={myLocation} className={btnQuiet}>
              📍 I&apos;m here
            </button>
          </div>
        </div>
        <p role="status" className="mt-2 min-h-6 font-hand text-xl">
          {placeMsg ?? (pin ? "" : "search, or tap the map where the cafe is")}
        </p>
        <div className="mt-2">
          <PinPicker centre={centre} pin={pin} onPin={setPin} />
        </div>
        <input type="hidden" name="lat" value={pin ? pin.lat.toFixed(6) : ""} />
        <input type="hidden" name="lng" value={pin ? pin.lng.toFixed(6) : ""} />
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="cafe-street" className={label}>
            street address <span className="normal-case tracking-normal text-cola/60">(optional)</span>
          </label>
          <input id="cafe-street" name="street" maxLength={120} value={street} onChange={(e) => setStreet(e.target.value)} className={`${input} mt-2`} placeholder="we'll fill it in from the pin" />
        </div>
        <div>
          <label htmlFor="cafe-ig" className={label}>
            instagram <span className="normal-case tracking-normal text-cola/60">(optional)</span>
          </label>
          <input id="cafe-ig" name="instagram" maxLength={60} value={instagram} onChange={(e) => setInstagram(e.target.value)} className={`${input} mt-2`} placeholder="@littlebeancoffee" />
        </div>
      </div>

      {state.duplicate && !confirmNew && (
        <div role="alert" className="rounded-2xl border-2 border-cola bg-lemon p-5">
          <p className="font-display text-xl">is it this one?</p>
          <p className="mt-1">
            <b>{state.duplicate.name}</b> is already on latteletters, {state.duplicate.metres} m from your pin.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href={`/cafe/${state.duplicate.id}#love-notes`} className={btn}>
              yes, review it →
            </Link>
            <button type="button" onClick={() => setConfirmNew(true)} className={btnQuiet}>
              no, it&apos;s a different cafe
            </button>
          </div>
        </div>
      )}
      {confirmNew && <input type="hidden" name="confirmNew" value="1" />}

      <FormMessage error={state.error} />
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={saving || !pin} className={btn}>
          {saving ? "adding…" : confirmNew ? "add it anyway ✦" : "add cafe & review it ✦"}
        </button>
        {!pin && <span className="text-sm text-cola/75">drop the pin first</span>}
      </div>
      <p className="text-sm text-cola/75">
        Cafes you add stay on latteletters for everyone, even if you delete your account later. Please only add real places you&apos;ve been to.
      </p>
    </form>
  );
}
