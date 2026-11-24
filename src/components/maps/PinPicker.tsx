"use client";

/**
 * "Where is it?" for adding a cafe: drag the cup, or tap the map to move it.
 * The arrow keys nudge the pin when it has focus, so it works by keyboard too.
 */
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { Map as MlMap, Marker } from "maplibre-gl";
import { cupSvg, loadMapLibre, pinkStyle } from "./maplibre";

export type LatLng = { lat: number; lng: number };

export function PinPicker({ centre, pin, onPin }: { centre: LatLng & { zoom: number }; pin: LatLng | null; onPin: (p: LatLng) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onPinRef = useRef(onPin);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onPinRef.current = onPin;
  }, [onPin]);

  // create the map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [ml, style] = await Promise.all([loadMapLibre(), pinkStyle()]);
      if (cancelled || !el.current) return;
      const map = new ml.Map({ container: el.current, style, center: [centre.lng, centre.lat], zoom: centre.zoom, attributionControl: { compact: true } });
      map.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");

      const button = document.createElement("button");
      button.type = "button";
      button.className = "map-pin map-pin--drag";
      button.innerHTML = cupSvg("#f08cb8");
      button.setAttribute("aria-label", "Cafe pin. Drag it, or use the arrow keys to move it.");
      const marker = new ml.Marker({ element: button, anchor: "bottom", draggable: true });
      const report = () => {
        const { lat, lng } = marker.getLngLat();
        onPinRef.current({ lat, lng });
      };
      marker.on("dragend", report);
      button.addEventListener("keydown", (e) => {
        const step = 0.00012 * (e.shiftKey ? 5 : 1);
        const d = { ArrowUp: [0, step], ArrowDown: [0, -step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] }[e.key];
        if (!d) return;
        e.preventDefault();
        const ll = marker.getLngLat();
        marker.setLngLat([ll.lng + d[0], ll.lat + d[1]]);
        report();
      });
      map.on("click", (e) => {
        marker.setLngLat(e.lngLat);
        if (!marker.getElement().isConnected) marker.addTo(map);
        report();
      });
      mapRef.current = map;
      markerRef.current = marker;
      setReady(true);
    })().catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // the map is created once; later centre/pin changes are applied below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // follow the search box / "use my location"
  useEffect(() => {
    if (ready) mapRef.current?.flyTo({ center: [centre.lng, centre.lat], zoom: centre.zoom, duration: 800 });
  }, [ready, centre]);

  // show the pin wherever the form says it is
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!ready || !map || !marker || !pin) return;
    marker.setLngLat([pin.lng, pin.lat]);
    if (!marker.getElement().isConnected) marker.addTo(map);
  }, [ready, pin]);

  if (failed)
    return <p className="rounded-2xl border-2 border-dashed border-cola/50 bg-lemon/70 p-6 text-center">The map didn&apos;t load. Refresh the page to try again.</p>;

  return (
    <div
      ref={el}
      className="relative z-0 h-80 w-full overflow-hidden rounded-2xl border-2 border-cola bg-cotton-deep shadow-[var(--shadow-paper)] sm:h-96"
    />
  );
}
