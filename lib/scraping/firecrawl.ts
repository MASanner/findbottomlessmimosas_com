/** Firecrawl scrape helper. v1 markdown + v2 JSON extraction for restaurant-only data. */

const FIRECRAWL_V1 = "https://api.firecrawl.dev/v1";
const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

export interface FirecrawlExtractResult {
  success: boolean;
  data?: {
    markdown?: string;
    metadata?: Record<string, unknown>;
    links?: string[];
  };
  error?: string;
}

/** Single restaurant item returned by LLM extraction (v2 scrape with JSON schema). */
export interface ExtractedRestaurant {
  name: string;
  address?: string;
  phone?: string;
  price_or_deal?: string;
  evidence_snippet?: string;
}

export interface FirecrawlRestaurantExtractResult {
  success: boolean;
  data?: {
    restaurants: ExtractedRestaurant[];
    metadata?: Record<string, unknown>;
  };
  error?: string;
}

/** JSON schema for v2 scrape: only extract restaurant listings, ignore nav/ads/filters. */
const RESTAURANT_EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    restaurants: {
      type: "array",
      description: "List of restaurant/brunch spot listings from the page",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Restaurant or business name" },
          address: { type: "string", description: "Street address if shown" },
          phone: { type: "string", description: "Phone number if shown" },
          price_or_deal: { type: "string", description: "Price or deal text e.g. $25 bottomless" },
          evidence_snippet: { type: "string", description: "Short phrase mentioning bottomless mimosas or brunch, max 50 chars" },
        },
        required: ["name"],
      },
    },
  },
  required: ["restaurants"],
} as const;

const RESTAURANT_EXTRACT_PROMPT =
  "Extract only the list of restaurants or brunch spots from this search or listing page. " +
  "For each business include: name (required), address and phone if shown, price_or_deal if mentioned, and a short evidence_snippet that mentions bottomless mimosas or brunch (max 50 chars). " +
  "Ignore navigation, filters, ads, footers, and any non-restaurant content. Return an empty restaurants array if there are no restaurant listings.";

/**
 * Scrape a URL and use Firecrawl v2 LLM extraction to return only restaurant listings.
 * Use this for Yelp/TripAdvisor search pages so we get structured data instead of full markdown.
 */
export async function extractRestaurantsFromUrl(
  apiKey: string,
  url: string
): Promise<FirecrawlRestaurantExtractResult> {
  const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: [
        {
          type: "json",
          schema: RESTAURANT_EXTRACT_SCHEMA,
          prompt: RESTAURANT_EXTRACT_PROMPT,
        },
      ],
      onlyMainContent: true,
      timeout: 60000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: err };
  }

  const json = await res.json();
  const rawList = json?.data?.json?.restaurants;
  const restaurants: ExtractedRestaurant[] = Array.isArray(rawList)
    ? rawList.filter((r: unknown) => r && typeof (r as ExtractedRestaurant).name === "string")
    : [];

  if (restaurants.length === 0 && json?.data) {
    const dataKeys = Object.keys(json.data);
    console.warn("[firecrawl] No restaurants in response. data keys:", dataKeys, "json?.data?.json keys:", json.data?.json ? Object.keys(json.data.json as object) : "none");
  }

  return {
    success: true,
    data: {
      restaurants,
      metadata: json?.data?.metadata,
    },
  };
}

export async function extractUrl(apiKey: string, url: string): Promise<FirecrawlExtractResult> {
  const res = await fetch(`${FIRECRAWL_V1}/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: err };
  }

  const data = await res.json();
  return {
    success: true,
    data: {
      markdown: data.data?.markdown,
      metadata: data.data?.metadata,
      links: data.data?.links,
    },
  };
}

/** Firecrawl search (optional) for SERP-style discovery. Returns URLs or empty. */
export async function searchUrls(apiKey: string, query: string, limit = 5): Promise<string[]> {
  const res = await fetch(`${FIRECRAWL_V1}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, limit }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  const urls = (data.data as { url?: string }[] | undefined)?.map((d) => d.url).filter(Boolean) as string[] ?? [];
  return urls.slice(0, limit);
}
