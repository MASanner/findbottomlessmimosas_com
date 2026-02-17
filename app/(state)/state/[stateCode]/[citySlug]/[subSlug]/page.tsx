import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { getSpotBySlug } from "@/lib/supabase/queries";
import { venueRestaurantJsonLd } from "@/lib/seo/jsonld";
import { getOwnerPortalUrl, getStateUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isVenueSlug(slug: string): boolean {
  const lastPart = slug.includes("-") ? slug.split("-").pop() : "";
  return UUID_REGEX.test(lastPart ?? "");
}

type Props = {
  params: Promise<{ stateCode: string; citySlug: string; subSlug: string }>;
};

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateCode, citySlug, subSlug } = await params;
  if (!isVenueSlug(subSlug)) return {};
  const spot = await getSpotBySlug(stateCode, citySlug, subSlug);
  if (!spot) return {};
  const cityName = spot.city;
  const stateUpper = spot.state;
  return {
    title: `${spot.name} Bottomless Mimosas in ${cityName}, ${stateUpper}`,
    description: spot.mimosa_price
      ? `Bottomless mimosas from $${spot.mimosa_price}. Call to confirm. ${spot.address}, ${cityName}, ${stateUpper}.`
      : `Bottomless mimosas in ${cityName}, ${stateUpper}. Call to confirm. ${spot.address}.`,
  };
}

export default async function NeighborhoodOrVenuePage({ params }: Props) {
  const { stateCode, citySlug, subSlug } = await params;
  const isVenue = isVenueSlug(subSlug);
  const cityName = citySlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const stateUpper = stateCode.toUpperCase();

  if (isVenue) {
    const spot = await getSpotBySlug(stateCode, citySlug, subSlug);
    if (!spot) notFound();

    const stateOrigin = getStateUrl(stateCode);
    const jsonLd = venueRestaurantJsonLd(spot, `${stateOrigin}/${citySlug}/${subSlug}`);

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <Nav host="state" stateCode={stateCode} />
        <main className="container mx-auto px-4 py-8">
          <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/30 p-4 mb-6 text-center text-sm">
            🍹 Deals change hourly. CALL TO CONFIRM before heading out.
          </div>
          <h1 className="text-4xl font-bold mb-4">{spot.name}</h1>
          <p className="text-muted-foreground mb-2">{spot.address}, {spot.city}, {spot.state}</p>
          <div className="flex flex-wrap gap-2 my-4">
            <a href={`tel:${spot.phone}`} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground font-medium hover:bg-primary/90">
              CALL NOW
            </a>
            {(spot.reservation_url || spot.website_url) && (
              <a
                href={spot.reservation_url || spot.website_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 font-medium hover:bg-accent"
              >
                VIEW DEAL / RESERVE
              </a>
            )}
            <a
              href={`https://www.openstreetmap.org/?query=${encodeURIComponent(spot.address + " " + spot.city + " " + spot.state)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 font-medium hover:bg-accent"
            >
              OPEN IN MAPS
            </a>
            <a href={getOwnerPortalUrl()} className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 font-medium hover:bg-accent">
              CLAIM THIS LISTING
            </a>
          </div>
          {spot.mimosa_price != null && <p className="font-medium text-primary">${spot.mimosa_price}</p>}
          {spot.hours && (
            <p className="text-sm text-muted-foreground">
              Hours: {typeof spot.hours === "object" ? JSON.stringify(spot.hours) : String(spot.hours)}
            </p>
          )}
          {spot.scraped_snippet && (
            <p className="text-sm text-muted-foreground mt-2">
              &ldquo;{spot.scraped_snippet}&rdquo;
              {spot.source_urls?.[0] && (
                <span> via {new URL(spot.source_urls[0]).hostname.replace("www.", "")}</span>
              )}
            </p>
          )}
          <Link href={`/${citySlug}`} className="text-primary underline mt-4 inline-block">← Back to {spot.city}</Link>
        </main>
      </>
    );
  }

  const neighborhoodName = subSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <>
      <Nav host="state" stateCode={stateCode} />
      <main className="container mx-auto px-4 py-8">
        <div className="rounded-lg border bg-muted/50 p-4 mb-6 text-center text-sm">
          🍹 Deals change hourly. CALL TO CONFIRM before heading out.
        </div>
        <h1 className="text-4xl font-bold mb-4">Bottomless Mimosas in {neighborhoodName}, {cityName}</h1>
        <p className="text-muted-foreground">Neighborhood page: same template as city with neighborhood filter (wire to getSpotsByCity with neighborhood).</p>
        <Link href={`/${citySlug}`} className="text-primary underline mt-4 inline-block">← Back to {cityName}</Link>
      </main>
    </>
  );
}
