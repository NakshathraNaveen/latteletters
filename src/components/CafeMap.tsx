"use client";

/**
 * Results on a map: MapLibre GL + OpenFreeMap tiles (free, no API key),
 * recoloured to match the site. The library loads only when someone switches
 * to map view. Nearby pins group into numbered bubbles that split as you zoom
 * in. Every pin and bubble is a real <button>, so the map works by keyboard.
 */
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MlMap, Marker } from "maplibre-gl";
import { cupSvg, esc, heartSvg, loadMapLibre, pinkStyle } from "./maps/maplibre";

export type MapPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: string | null;
  avg: number | null;
  reviews: number;
  colour: string;
};

export default function CafeMap({ pins, centre }: { pins: MapPin[]; centre: { lat: number; lng: number; label: string } }) {
  const el = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map: MlMap | null = null;

    (async () => {
      const [ml, style] = await Promise.all([loadMapLibre(), pinkStyle()]);
      if (cancelled || !el.current) return;
      map = new ml.Map({
        container: el.current,
        style,
        center: [centre.lng, centre.lat],
        zoom: 14,
        cooperativeGestures: true,
        attributionControl: { compact: true },
      });
      map.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");

      const you = document.createElement("div");
      you.className = "map-pin";
      you.innerHTML = heartSvg;
      you.title = centre.label === "you" ? "You are here" : centre.label;
      new ml.Marker({ element: you, anchor: "bottom" }).setLngLat([centre.lng, centre.lat]).addTo(map);

      const byId = new Map(pins.map((p) => [p.id, p]));
      const onScreen = new Map<string, Marker>();

      const popupFor = (p: MapPin) => {
        const stars = p.avg ? `<span class="map-card__stars">★ ${p.avg.toFixed(1)}</span> <span class="map-card__muted">(${p.reviews})</span>` : "";
        return new ml.Popup({ offset: 36, maxWidth: "220px", closeButton: true }).setHTML(
          `<div class="map-card">
            <p class="map-card__name">${esc(p.name)}</p>
            <p class="map-card__meta">${p.distance ? `${esc(p.distance)} away` : ""} ${stars}</p>
            <a class="map-card__link" href="/cafe/${encodeURIComponent(p.id)}">open cafe page →</a>
          </div>`,
        );
      };

      /** Keep one HTML marker per visible pin or bubble, like MapLibre's "HTML clusters" example. */
      const sync = () => {
        if (!map?.isSourceLoaded("cafes")) return;
        const source = map.getSource("cafes") as GeoJSONSource;
        const want = new Set<string>();
        for (const f of map.querySourceFeatures("cafes")) {
          const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
          const props = f.properties ?? {};
          const key = props.cluster ? `cluster-${props.cluster_id}` : String(props.id);
          if (want.has(key)) continue;
          want.add(key);
          if (onScreen.has(key)) continue;

          const button = document.createElement("button");
          button.type = "button";
          let marker: Marker;
          if (props.cluster) {
            const n = props.point_count as number;
            button.className = "map-cluster";
            button.innerHTML = `<span aria-hidden="true">${n}</span><span class="sr-only">${n} cafes here, zoom in to see them</span>`;
            button.addEventListener("click", async () => {
              const zoom = await source.getClusterExpansionZoom(props.cluster_id as number);
              map?.easeTo({ center: coords, zoom });
            });
            marker = new ml.Marker({ element: button });
          } else {
            const p = byId.get(String(props.id));
            if (!p) continue;
            button.className = "map-pin";
            button.innerHTML = cupSvg(p.colour);
            button.setAttribute("aria-label", p.name);
            button.title = p.name;
            marker = new ml.Marker({ element: button, anchor: "bottom" }).setPopup(popupFor(p));
          }
          marker.setLngLat(coords).addTo(map);
          onScreen.set(key, marker);
        }
        for (const [key, marker] of onScreen) {
          if (!want.has(key)) {
            marker.remove();
            onScreen.delete(key);
          }
        }
      };

      map.on("load", () => {
        if (!map) return;
        map.addSource("cafes", {
          type: "geojson",
          cluster: true,
          clusterRadius: 40,
          clusterMaxZoom: 17,
          data: {
            type: "FeatureCollection",
            features: pins.map((p) => ({ type: "Feature", properties: { id: p.id }, geometry: { type: "Point", coordinates: [p.lng, p.lat] } })),
          },
        });
        // an invisible layer so the source gets tiled; the pins themselves are HTML markers
        map.addLayer({ id: "cafes-hit", type: "circle", source: "cafes", paint: { "circle-radius": 0, "circle-opacity": 0 } });
        if (pins.length) {
          const b = new ml.LngLatBounds([centre.lng, centre.lat], [centre.lng, centre.lat]);
          for (const p of pins) b.extend([p.lng, p.lat]);
          map.fitBounds(b, { padding: 40, maxZoom: 16, duration: 0 });
        }
      });
      map.on("render", sync);
    })().catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [pins, centre]);

  if (failed)
    return (
      <p className="rounded-2xl border-2 border-dashed border-cola/50 bg-lemon/70 p-6 text-center font-hand text-2xl">
        the map didn&apos;t load. Switch back to the list, or try again in a moment.
      </p>
    );

  return (
    <div
      ref={el}
      role="region"
      aria-label={`Map of ${pins.length} cafes near ${centre.label}`}
      className="relative z-0 h-[70vh] min-h-80 w-full overflow-hidden rounded-2xl border-2 border-cola bg-cotton-deep shadow-[var(--shadow-paper)] md:h-[34rem]"
    />
  );
}
