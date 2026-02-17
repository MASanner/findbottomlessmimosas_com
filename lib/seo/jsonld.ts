import type { MimosaSpot } from "@/lib/types/database";

export function venueRestaurantJsonLd(spot: MimosaSpot, venueCanonicalUrl: string): string {
  const url = venueCanonicalUrl;
  const address = {
    "@type": "PostalAddress",
    streetAddress: spot.address,
    addressLocality: spot.city,
    addressRegion: spot.state,
  };
  const geo = spot.lat && spot.lon ? { "@type": "GeoCoordinates", latitude: spot.lat, longitude: spot.lon } : undefined;
  const openingHours = spot.hours
    ? (typeof spot.hours === "object" && spot.hours !== null
        ? Object.entries(spot.hours as Record<string, string>).map(([day, time]) => `${day} ${time}`)
        : [])
    : undefined;
  const offers = spot.mimosa_price
    ? { "@type": "Offer", price: spot.mimosa_price, priceCurrency: "USD" }
    : undefined;

  const obj = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: spot.name,
    address,
    ...(geo && { geo }),
    telephone: spot.phone,
    url,
    ...(openingHours && openingHours.length > 0 && { openingHoursSpecification: openingHours.map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.split(" ")[0], opens: h.split(" ")[1]?.split("-")[0], closes: h.split(" ")[1]?.split("-")[1] })) }),
    ...(offers && { offers }),
  };

  return JSON.stringify(obj);
}

export function cityItemListJsonLd(
  items: { name: string; id: string; city: string; state: string }[],
  cityName: string,
  stateCode: string,
  baseUrl: string
): string {
  const listItems = items.slice(0, 20).map((s) => {
    const slug = [s.city, s.name, s.id].map((x) => x.toLowerCase().replace(/[^a-z0-9]+/g, "-")).join("-");
    return {
      "@type": "ListItem",
      position: 1,
      url: `${baseUrl}/${slug}`,
      name: s.name,
    };
  });
  listItems.forEach((item, i) => { item.position = i + 1; });

  const obj = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Bottomless Mimosas in ${cityName}, ${stateCode}`,
    numberOfItems: listItems.length,
    itemListElement: listItems,
  };

  return JSON.stringify(obj);
}
