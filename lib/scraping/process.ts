/**
 * Process extracted restaurants into mimosa_spots (normalize → score → validate → upsert).
 * Shared by scrape (after Firecrawl) and reprocess (from scrape_raw).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { scoreCandidate } from "@/lib/scraping/score";
import { normalizeCandidate } from "@/lib/scraping/normalize";
import { getDedupeKey } from "@/lib/scraping/dedupe";
import { validateVenueRow, CITY_CENTERS } from "@/lib/scraping/validate";
import type { ExtractedRestaurant } from "@/lib/scraping/firecrawl";
import type { RawCandidate } from "@/lib/scraping/normalize";

function mapExtractedToRaw(r: ExtractedRestaurant, sourceUrl: string): RawCandidate {
  let price: number | string | undefined;
  if (r.price_or_deal) {
    const match = r.price_or_deal.match(/\$?\s*(\d{1,2})/);
    if (match) price = parseInt(match[1], 10);
    else price = r.price_or_deal;
  }
  return {
    name: r.name,
    address: r.address,
    phone: r.phone,
    price,
    evidence_snippet: r.evidence_snippet,
    source_url: sourceUrl,
  };
}

export interface ProcessResult {
  inserted: number;
  updated: number;
  published: number;
  pending: number;
  normalized: number;
  scored: number;
  validated: number;
}

export async function processExtractedRestaurants(
  restaurants: ExtractedRestaurant[],
  url: string,
  city: string,
  state: string,
  supabase: SupabaseClient
): Promise<ProcessResult> {
  const stats: ProcessResult = { inserted: 0, updated: 0, published: 0, pending: 0, normalized: 0, scored: 0, validated: 0 };
  for (const r of restaurants) {
    const raw = mapExtractedToRaw(r, url);
    const norm = normalizeCandidate(raw, city, state);
    if (!norm) continue;
    stats.normalized++;

    const textForScoring = [r.evidence_snippet, r.price_or_deal].filter(Boolean).join(" ") || r.name;
    const scored = scoreCandidate(textForScoring, {
      name: norm.name,
      address: norm.address,
      city: norm.city,
      state: norm.state,
      phone: norm.phone,
      price: norm.price,
      sourceUrl: norm.sourceUrl,
      hours: norm.hours,
    });
    if (scored.score === 0) continue;
    stats.scored++;

    const dedupeKey = getDedupeKey(norm.name, norm.address, norm.city, norm.state);
    const isPublished = scored.score >= 3;
    const center = CITY_CENTERS[city] ?? { lat: 27.9506, lon: -82.4572 };
    const rawRow = {
      name: scored.name,
      state: scored.state,
      city: scored.city,
      address: scored.address,
      phone: scored.phone,
      mimosa_price: norm.price ?? null,
      confirmation_score: scored.score,
      source_urls: [scored.sourceUrl],
      scraped_snippet: scored.evidenceSnippet?.slice(0, 50) ?? null,
      dedupe_key: dedupeKey,
    };
    const row = validateVenueRow(
      { ...rawRow, lat: center.lat, lon: center.lon },
      center.lat,
      center.lon
    );
    if (!row) continue;
    stats.validated++;

    const insertRow = {
      ...row,
      is_published: isPublished,
      human_reviewed: false,
      scraped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("mimosa_spots")
      .select("id, is_published")
      .eq("dedupe_key", row.dedupe_key)
      .single();

    if (existing) {
      const { data: cur } = await supabase.from("mimosa_spots").select("source_urls").eq("id", existing.id).single();
      const sourceUrlsList = Array.isArray(cur?.source_urls) ? [...(cur.source_urls as string[]), scored.sourceUrl] : [scored.sourceUrl];
      await supabase
        .from("mimosa_spots")
        .update({
          confirmation_score: row.confirmation_score,
          scraped_snippet: row.scraped_snippet,
          source_urls: sourceUrlsList,
          is_published: isPublished,
          scraped_at: insertRow.scraped_at,
          updated_at: insertRow.updated_at,
        })
        .eq("id", existing.id);
      stats.updated++;
    } else {
      await supabase.from("mimosa_spots").insert(insertRow);
      stats.inserted++;
    }
    if (isPublished) stats.published++;
    else stats.pending++;
  }
  return stats;
}
