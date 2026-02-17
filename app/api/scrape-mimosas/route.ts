import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractRestaurantsFromUrl } from "@/lib/scraping/firecrawl";
import { processExtractedRestaurants } from "@/lib/scraping/process";

const APPROVED_CITIES = [
  { city: "Tampa", state: "FL" },
  { city: "Orlando", state: "FL" },
  { city: "Miami", state: "FL" },
  { city: "St. Petersburg", state: "FL" },
] as const;

/**
 * Scrape URLs per city. Format:
 * - Yelp: find_desc=bottomless+mimosas&find_loc=[City]%2C+FL
 * - TripAdvisor: Restaurants-g[5-DIGIT-CODE]-zfp10606-[City]_[State].html
 *   (Get g code: Google "[city] tripadvisor brunch" and use the gXXXXX from the result.)
 */
const SOURCE_URLS_BY_CITY: Partial<Record<(typeof APPROVED_CITIES)[number]["city"], string[]>> = {
  Tampa: [
    "https://www.yelp.com/search?find_desc=bottomless+mimosas&find_loc=Tampa%2C+FL",
    "https://www.tripadvisor.com/Restaurants-g34678-zfp10606-Tampa_Florida.html",
  ],
  Orlando: [
    "https://www.yelp.com/search?find_desc=bottomless+mimosas&find_loc=Orlando%2C+FL",
    "https://www.tripadvisor.com/Restaurants-g34515-zfp10606-Orlando_Florida.html",
  ],
  Miami: [
    "https://www.yelp.com/search?find_desc=bottomless+mimosas&find_loc=Miami%2C+FL",
    "https://www.tripadvisor.com/Restaurants-g34438-zfp10606-Miami_Florida.html",
  ],
  "St. Petersburg": [
    "https://www.yelp.com/search?find_desc=bottomless+mimosas&find_loc=St.+Petersburg%2C+FL",
    "https://www.tripadvisor.com/Restaurants-g34607-zfp10606-St_Petersburg_Florida.html",
  ],
};

export const maxDuration = 300;

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "FIRECRAWL_API_KEY not set" }, { status: 500 });
  }

  const supabase = createAdminClient();
  const stats = { inserted: 0, updated: 0, published: 0, pending: 0 };
  const debugPerUrl: { url: string; extracted: number; normalized: number; scored: number; validated: number }[] = [];

  for (const { city, state } of APPROVED_CITIES) {
    const urls = SOURCE_URLS_BY_CITY[city] ?? [];
    for (const url of urls) {
      let extracted = 0;
      try {
        const result = await extractRestaurantsFromUrl(apiKey, url);
        extracted = result.data?.restaurants?.length ?? 0;
        if (!result.success) {
          console.warn("[scrape] Firecrawl failed:", url, result.error?.slice(0, 200));
        } else if (extracted === 0) {
          console.warn("[scrape] No restaurants extracted from:", url);
        }
        if (!result.success || !result.data?.restaurants?.length) {
          debugPerUrl.push({ url, extracted: 0, normalized: 0, scored: 0, validated: 0 });
          continue;
        }

        const restaurants = result.data.restaurants;
        await supabase.from("scrape_raw").insert({
          url,
          city,
          state,
          scraped_at: new Date().toISOString(),
          payload: { restaurants },
        });

        const processed = await processExtractedRestaurants(restaurants, url, city, state, supabase);
        stats.inserted += processed.inserted;
        stats.updated += processed.updated;
        stats.published += processed.published;
        stats.pending += processed.pending;
        debugPerUrl.push({
          url,
          extracted: restaurants.length,
          normalized: processed.normalized,
          scored: processed.scored,
          validated: processed.validated,
        });
      } catch (e) {
        console.error("Scrape error", url, e);
        debugPerUrl.push({ url, extracted: extracted ?? 0, normalized: 0, scored: 0, validated: 0 });
      }
    }

    if (urls.length > 0) {
      await supabase.from("scrape_jobs").insert({
        state,
        city,
        source: "firecrawl",
        status: "completed",
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
    }
  }

  const body: { ok: boolean; inserted: number; updated: number; published: number; pending: number; debug?: typeof debugPerUrl } = {
    ok: true,
    inserted: stats.inserted,
    updated: stats.updated,
    published: stats.published,
    pending: stats.pending,
  };
  if (stats.inserted === 0 && stats.updated === 0 && debugPerUrl.length > 0) {
    body.debug = debugPerUrl;
  }
  return NextResponse.json(body);
}
