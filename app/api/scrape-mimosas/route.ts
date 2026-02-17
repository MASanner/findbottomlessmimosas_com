import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractUrl } from "@/lib/scraping/firecrawl";
import { scoreCandidate } from "@/lib/scraping/score";
import { normalizeCandidate } from "@/lib/scraping/normalize";
import { getDedupeKey } from "@/lib/scraping/dedupe";

const APPROVED_CITIES = [
  { city: "Tampa", state: "FL" },
  { city: "Orlando", state: "FL" },
  { city: "Miami", state: "FL" },
  { city: "St. Petersburg", state: "FL" },
] as const;

/** MVP: stub sources - in production these would be Yelp/TripAdvisor/blog SERP URLs */
const SOURCE_QUERIES: Record<string, string[]> = {
  yelp: [],
  tripadvisor: [],
  blog: [],
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

  for (const { city, state } of APPROVED_CITIES) {
    for (const [source, urls] of Object.entries(SOURCE_QUERIES)) {
      const toScrape = urls.length ? urls : [];
      for (const url of toScrape) {
        try {
          const result = await extractUrl(apiKey, url);
          if (!result.success || !result.data?.markdown) continue;

          const rawCandidates = parseCandidatesFromMarkdown(result.data.markdown, url);
          for (const raw of rawCandidates) {
            const norm = normalizeCandidate(raw, city, state);
            if (!norm) continue;

            const scored = scoreCandidate(result.data.markdown, {
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

            const dedupeKey = getDedupeKey(norm.name, norm.address, norm.city, norm.state);
            const isPublished = scored.score >= 3;
            const row = {
              name: scored.name,
              state: scored.state,
              city: scored.city,
              address: scored.address,
              phone: scored.phone,
              lat: 0,
              lon: 0,
              mimosa_price: norm.price ?? null,
              confirmation_score: scored.score,
              source_urls: [scored.sourceUrl],
              scraped_snippet: scored.evidenceSnippet?.slice(0, 50) ?? null,
              is_published: isPublished,
              human_reviewed: false,
              dedupe_key: dedupeKey,
              scraped_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const { data: existing } = await supabase
              .from("mimosa_spots")
              .select("id, is_published")
              .eq("dedupe_key", dedupeKey)
              .single();

            if (existing) {
              const { data: cur } = await supabase.from("mimosa_spots").select("source_urls").eq("id", existing.id).single();
              const urls = Array.isArray(cur?.source_urls) ? [...(cur.source_urls as string[]), scored.sourceUrl] : [scored.sourceUrl];
              await supabase
                .from("mimosa_spots")
                .update({
                  confirmation_score: row.confirmation_score,
                  scraped_snippet: row.scraped_snippet,
                  source_urls: urls,
                  is_published: row.is_published,
                  scraped_at: row.scraped_at,
                  updated_at: row.updated_at,
                })
                .eq("id", existing.id);
              stats.updated++;
            } else {
              const defaultLat = state === "FL" ? 27.9506 : 0;
              const defaultLon = state === "FL" ? -82.4572 : 0;
              await supabase.from("mimosa_spots").insert({
                ...row,
                lat: defaultLat,
                lon: defaultLon,
              });
              stats.inserted++;
            }
            if (isPublished) stats.published++;
            else stats.pending++;
          }
        } catch (e) {
          console.error("Scrape error", url, e);
        }
      }

      await supabase.from("scrape_jobs").insert({
        state,
        city,
        source,
        status: "completed",
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    inserted: stats.inserted,
    updated: stats.updated,
    published: stats.published,
    pending: stats.pending,
  });
}

/** Naive parse: look for list-like patterns in markdown. Replace with real extraction per source. */
function parseCandidatesFromMarkdown(markdown: string, sourceUrl: string): Array<Record<string, unknown>> {
  const candidates: Array<Record<string, unknown>> = [];
  const lines = markdown.split("\n").filter((l) => l.trim());
  let current: Record<string, unknown> = { source_url: sourceUrl };
  for (const line of lines) {
    if (line.startsWith("##") || line.startsWith("#")) {
      if (current.name || current.address) candidates.push({ ...current });
      current = { source_url: sourceUrl, name: line.replace(/^#+\s*/, "").trim() };
    } else if (line.includes("$") && /^\s*\$?\d+/.test(line)) {
      const match = line.match(/\$?(\d{1,2})/);
      if (match) current.price = parseInt(match[1], 10);
    } else if (line.match(/\d{3}[-.]?\d{3}[-.]?\d{4}/)) {
      current.phone = line.match(/\d{3}[-.]?\d{3}[-.]?\d{4}/)?.[0];
    } else if (line.length > 10 && line.length < 200 && !line.startsWith("[")) {
      if (!current.address) current.address = line;
      else if (!current.detected_city) current.detected_city = line;
    }
  }
  if (current.name || current.address) candidates.push(current);
  return candidates;
}
