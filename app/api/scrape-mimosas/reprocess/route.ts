/**
 * Re-run normalization → score → validate → upsert from stored scrape_raw data.
 * Does not call Firecrawl. Use after changing normalize/score/validate logic.
 * Same auth as scrape: x-cron-secret.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processExtractedRestaurants } from "@/lib/scraping/process";
import type { ExtractedRestaurant } from "@/lib/scraping/firecrawl";

export const maxDuration = 120;

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const stats = { inserted: 0, updated: 0, published: 0, pending: 0 };
  const debugPerUrl: { url: string; extracted: number; normalized: number; scored: number; validated: number }[] = [];

  const { data: rows, error } = await supabase
    .from("scrape_raw")
    .select("id, url, city, state, scraped_at, payload")
    .order("scraped_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const seen = new Set<string>();
  for (const row of rows ?? []) {
    if (seen.has(row.url)) continue;
    seen.add(row.url);

    const payload = row.payload as { restaurants?: unknown } | null;
    const restaurants = Array.isArray(payload?.restaurants) ? payload.restaurants : [];
    const valid = restaurants.filter(
      (r): r is ExtractedRestaurant => r != null && typeof (r as ExtractedRestaurant).name === "string"
    );

    if (valid.length === 0) {
      debugPerUrl.push({ url: row.url, extracted: 0, normalized: 0, scored: 0, validated: 0 });
      continue;
    }

    const processed = await processExtractedRestaurants(valid, row.url, row.city, row.state, supabase);
    stats.inserted += processed.inserted;
    stats.updated += processed.updated;
    stats.published += processed.published;
    stats.pending += processed.pending;
    debugPerUrl.push({
      url: row.url,
      extracted: valid.length,
      normalized: processed.normalized,
      scored: processed.scored,
      validated: processed.validated,
    });
  }

  return NextResponse.json({
    ok: true,
    source: "scrape_raw",
    inserted: stats.inserted,
    updated: stats.updated,
    published: stats.published,
    pending: stats.pending,
    debug: debugPerUrl,
  });
}
