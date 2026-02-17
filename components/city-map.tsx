"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { MimosaSpot } from "@/lib/types/database";

const MapInner = dynamic(() => import("./city-map-inner"), { ssr: false });

export function CityMap({ spots, featuredIds }: { spots: MimosaSpot[]; featuredIds: Set<string> }) {
  const featuredSet = useMemo(() => featuredIds, [featuredIds]);
  return <MapInner spots={spots} featuredIds={featuredSet} />;
}
