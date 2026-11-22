"use client";

/**
 * Results on a map: OpenStreetMap tiles via Leaflet (free, no API key).
 * Leaflet touches `window`, so it is imported inside the effect and the
 * map only loads when someone switches to map view. Nearby pins are grouped
 * into numbered bubbles (leaflet.markercluster) that split as you zoom in.
 */
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { useEffect, useRef } from "react";

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

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const cupSvg = (fill: string) =>
  `<svg viewBox="0 0 40 48" width="34" height="41" aria-hidden="true">
    <ellipse cx="20" cy="45" rx="11" ry="2.5" fill="#47131c" opacity=".25"/>
    <path d="M7 12 H33 L30 42 Q20 45 10 42 Z" fill="${fill}" stroke="#47131c" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="5" y="8" width="30" height="6" rx="3" fill="#fffde9" stroke="#47131c" stroke-width="2.5"/>
    <path d="M24 8 L28 1" stroke="#47131c" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M20 31 C14 26 14 22 17 21.5 C18.5 21.2 20 22.5 20 23.5 C20 22.5 21.5 21.2 23 21.5 C26 22 26 26 20 31Z" fill="#fffde9"/>
  </svg>`;

const youSvg = `<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
  <path d="M20 36 C4 24 2 12 10 8 C15 6 19 9 20 12 C21 9 25 6 30 8 C38 12 36 24 20 36Z" fill="#f08cb8" stroke="#47131c" stroke-width="2.5" stroke-linejoin="round"/>
</svg>`;

export default function CafeMap({ pins, centre }: { pins: MapPin[]; centre: { lat: number; lng: number; label: string } }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    (async () => {
      const L = (await import("leaflet")).default;
      // the cluster plugin attaches itself to the global L
      (window as unknown as { L: typeof L }).L = L;
      await import("leaflet.markercluster");
      if (cancelled || !el.current) return;
      const map = L.map(el.current, { scrollWheelZoom: false, zoomControl: true }).setView([centre.lat, centre.lng], 14);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      L.marker([centre.lat, centre.lng], {
        icon: L.divIcon({ html: youSvg, className: "map-pin", iconSize: [34, 34], iconAnchor: [17, 30] }),
        title: centre.label === "you" ? "You are here" : centre.label,
        keyboard: false,
      }).addTo(map);

      const groups = L.markerClusterGroup({
        maxClusterRadius: 40,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 18,
        iconCreateFunction: (cluster) => {
          const n = cluster.getChildCount();
          return L.divIcon({
            html: `<span class="map-cluster__count" aria-hidden="true">${n}</span><span class="sr-only">${n} cafes here, zoom in to see them</span>`,
            className: "map-cluster",
            iconSize: [40, 40],
          });
        },
      });
      const bounds = L.latLngBounds([[centre.lat, centre.lng]]);
      for (const p of pins) {
        bounds.extend([p.lat, p.lng]);
        const stars = p.avg ? `<span class="map-card__stars">★ ${p.avg.toFixed(1)}</span> <span class="map-card__muted">(${p.reviews})</span>` : "";
        L.marker([p.lat, p.lng], {
          icon: L.divIcon({ html: cupSvg(p.colour), className: "map-pin", iconSize: [34, 41], iconAnchor: [17, 40], popupAnchor: [0, -36] }),
          title: p.name,
          alt: p.name,
          riseOnHover: true,
        })
          .bindPopup(
            `<div class="map-card">
              <p class="map-card__name">${esc(p.name)}</p>
              <p class="map-card__meta">${p.distance ? `${esc(p.distance)} away` : ""} ${stars}</p>
              <a class="map-card__link" href="/cafe/${encodeURIComponent(p.id)}">open cafe page →</a>
            </div>`,
            { closeButton: true, maxWidth: 220 },
          )
          .addTo(groups);
      }
      groups.addTo(map);
      if (pins.length) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 });
      cleanup = () => map.remove();
    })();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [pins, centre]);

  return (
    <div
      ref={el}
      role="region"
      aria-label={`Map of ${pins.length} cafes near ${centre.label}`}
      className="relative z-0 h-[70vh] min-h-80 w-full overflow-hidden rounded-2xl border-2 border-cola shadow-[var(--shadow-paper)] md:h-[34rem]"
    />
  );
}
