"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MimosaSpot } from "@/lib/types/database";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const featuredIcon = L.divIcon({
  className: "featured-marker",
  html: "<span style='background:orange;color:#fff;padding:2px 6px;border-radius:50%;font-size:14px'>★</span>",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function CityMapInner({ spots, featuredIds }: { spots: MimosaSpot[]; featuredIds: Set<string> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const center: [number, number] = spots.length ? [spots[0].lat, spots[0].lon] : [27.9506, -82.4572];
    const map = L.map(el).setView(center, 11);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    spots.forEach((spot) => {
      const icon = featuredIds.has(spot.id) ? featuredIcon : defaultIcon;
      const marker = L.marker([spot.lat, spot.lon], { icon }).addTo(map);
      const content =
        `<strong>${escapeHtml(spot.name)}</strong><br/>${escapeHtml(spot.address)}<br/>` +
        (spot.mimosa_price != null ? `$${spot.mimosa_price}` : "");
      marker.bindPopup(content);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [spots, featuredIds]);

  return (
    <div
      ref={containerRef}
      className="h-[400px] w-full rounded-lg border bg-muted z-0"
      aria-label="Map of venues"
    />
  );
}

function escapeHtml(s: string): string {
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.textContent = s;
    return div.innerHTML;
  }
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
