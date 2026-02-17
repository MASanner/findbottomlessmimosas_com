/** Normalize raw Firecrawl/scrape output into candidate records for scoring and upsert. */

export interface RawCandidate {
  name?: string;
  address?: string;
  phone?: string;
  price?: number | string;
  evidence_snippet?: string;
  source_url?: string;
  detected_city?: string;
  detected_state?: string;
  hours?: string | Record<string, string>;
}

export interface NormalizedCandidate {
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  price?: number;
  evidenceSnippet?: string;
  sourceUrl: string;
  hours?: string;
}

const ADDRESS_PLACEHOLDER = "Address not listed";

export function normalizeCandidate(
  raw: RawCandidate,
  fallbackCity: string,
  fallbackState: string
): NormalizedCandidate | null {
  const name = (raw.name ?? "").trim();
  if (!name) return null;
  const address = (raw.address ?? "").trim() || ADDRESS_PLACEHOLDER;

  let price: number | undefined;
  if (typeof raw.price === "number" && raw.price >= 15 && raw.price <= 99) {
    price = raw.price;
  } else if (typeof raw.price === "string") {
    const n = parseInt(raw.price.replace(/\D/g, ""), 10);
    if (n >= 15 && n <= 99) price = n;
  }

  const hours =
    typeof raw.hours === "string"
      ? raw.hours
      : raw.hours && typeof raw.hours === "object"
      ? JSON.stringify(raw.hours)
      : undefined;

  return {
    name,
    address,
    city: (raw.detected_city ?? fallbackCity).trim() || fallbackCity,
    state: (raw.detected_state ?? fallbackState).trim().toUpperCase().slice(0, 2) || fallbackState,
    phone: (raw.phone ?? "").trim() || "Not listed",
    price,
    evidenceSnippet: raw.evidence_snippet?.slice(0, 50),
    sourceUrl: (raw.source_url ?? "").trim() || "",
    hours,
  };
}
