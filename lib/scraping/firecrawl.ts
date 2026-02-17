/** Firecrawl scrape helper. MVP: single URL extract. */

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

export interface FirecrawlExtractResult {
  success: boolean;
  data?: {
    markdown?: string;
    metadata?: Record<string, unknown>;
    links?: string[];
  };
  error?: string;
}

export async function extractUrl(apiKey: string, url: string): Promise<FirecrawlExtractResult> {
  const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
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
  const res = await fetch(`${FIRECRAWL_BASE}/search`, {
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
