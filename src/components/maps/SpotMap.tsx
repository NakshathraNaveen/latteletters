"use client";

/** The little "find it" map on a cafe page: one cup pin, pink map. */
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { Map as MlMap } from "maplibre-gl";
import { cupSvg, loadMapLibre, pinkStyle } from "./maplibre";

export function SpotMap({ lat, lng, name, colour }: { lat: number; lng: number; name: string; colour: string }) {
  const el = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map: MlMap | null = null;
    (async () => {
      const [ml, style] = await Promise.all([loadMapLibre(), pinkStyle()]);
      if (cancelled || !el.current) return;
      map = new ml.Map({ container: el.current, style, center: [lng, lat], zoom: 16, cooperativeGestures: true, attributionControl: { compact: true } });
      map.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
      const pin = document.createElement("div");
      pin.className = "map-pin";
      pin.innerHTML = cupSvg(colour);
      new ml.Marker({ element: pin, anchor: "bottom" }).setLngLat([lng, lat]).addTo(map);
    })().catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng, colour]);

  return (
    <div
      ref={el}
      role="img"
      aria-label={`Map showing the location of ${name}`}
      className="relative aspect-[4/3] w-full overflow-hidden bg-cotton-deep"
    >
      {failed && <p className="grid h-full place-items-center p-4 text-center font-hand text-xl">the map didn&apos;t load, but directions still work ↓</p>}
    </div>
  );
}
