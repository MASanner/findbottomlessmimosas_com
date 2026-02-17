"use client";

import Link from "next/link";
import type { MimosaSpot } from "@/lib/types/database";
import { slugify } from "@/lib/utils";
import { getOwnerPortalUrl } from "@/lib/site-url";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

const DISCLAIMER =
  "🍹 Deals change hourly. Prices/availability shown from public sources. CALL TO CONFIRM before heading out. We're a directory, not your reservation desk.";

export function ListingCard({
  spot,
  stateCode,
  citySlug,
}: {
  spot: MimosaSpot;
  stateCode: string;
  citySlug: string;
}) {
  const venueSlug = `${slugify(spot.name)}-${spot.id}`;
  const href = `/${citySlug}/${venueSlug}`;
  const sourceDomain = spot.source_urls?.[0]
    ? new URL(spot.source_urls[0]).hostname.replace("www.", "")
    : null;

  async function trackCall() {
    try {
      await fetch("/api/metrics/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spot_id: spot.id }),
      });
    } catch {
      // ignore
    }
  }

  async function trackOutbound() {
    try {
      await fetch("/api/metrics/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spot_id: spot.id }),
      });
    } catch {
      // ignore
    }
  }

  return (
    <Card className={!spot.is_published ? "opacity-75" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Link href={href} className="font-semibold text-lg hover:underline">
            {spot.name}
          </Link>
          {spot.featured && (
            <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">Featured</span>
          )}
          {!spot.is_published && (
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">Pending</span>
          )}
        </div>
        {spot.mimosa_price != null && (
          <p className="text-sm font-medium text-primary">${spot.mimosa_price}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{spot.address}</p>
        {spot.scraped_snippet && (
          <p className="text-xs text-muted-foreground">
            &ldquo;{spot.scraped_snippet}&rdquo;
            {sourceDomain && (
              <span className="ml-1">via {sourceDomain}</span>
            )}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{DISCLAIMER}</p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <a href={`tel:${spot.phone}`} onClick={trackCall}>
          <Button size="sm">CALL NOW</Button>
        </a>
        {(spot.reservation_url || spot.website_url) && (
          <a
            href={spot.reservation_url || spot.website_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackOutbound}
          >
            <Button size="sm" variant="secondary">VIEW DEAL / RESERVE</Button>
          </a>
        )}
        <a
          href={`https://www.openstreetmap.org/?query=${encodeURIComponent(spot.address + " " + spot.city + " " + spot.state)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button size="sm" variant="outline">MAP</Button>
        </a>
        <a href={getOwnerPortalUrl()}>
          <Button size="sm" variant="ghost">CLAIM THIS LISTING</Button>
        </a>
      </CardFooter>
    </Card>
  );
}
