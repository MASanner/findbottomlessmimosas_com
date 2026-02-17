"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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
  const center: [number, number] = spots.length ? [spots[0].lat, spots[0].lon] : [27.9506, -82.4572];

  return (
    <MapContainer
      center={center}
      zoom={11}
      className="h-[400px] w-full rounded-lg border bg-muted z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lon]}
          icon={featuredIds.has(spot.id) ? featuredIcon : defaultIcon}
        >
          <Popup>
            <strong>{spot.name}</strong>
            <br />
            {spot.address}
            <br />
            {spot.mimosa_price != null && `$${spot.mimosa_price}`}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
