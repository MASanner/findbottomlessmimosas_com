/**
 * Validate and sanitize venue data before insert/update.
 * Rejects rows that look like UI text, URLs, or malformed data.
 */

const MAX_NAME = 200;
const MAX_ADDRESS = 300;
const MAX_SNIPPET = 50;
const MIN_NAME_LEN = 2;
const MIN_ADDRESS_LEN = 10;

/** UI / nav text that should never be used as venue name or address */
const GARBAGE_PATTERNS = [
  /^sort\s+by/i,
  /^filter/i,
  /^sign\s+in/i,
  /^create\s+account/i,
  /^privacy\s+policy/i,
  /^terms\s+of\s+use/i,
  /^cookie/i,
  /^©\s*\d/i,
  /^all\s+rights\s+reserved/i,
  /^people\s+also\s+(search|view)/i,
  /^see\s+more/i,
  /^view\s+all/i,
  /^page\s+\d+/i,
  /^https?:\/\//i,
  /^www\./i,
  /^\d+\s*results?/i,
  /^loading/i,
  /^search\s+for/i,
  /^near\s+me/i,
  /^map\s+view/i,
  /^list\s+view/i,
];

/** Address should contain a number (street number) or common street suffix */
const ADDRESS_LIKE = /\d|st\.|street|ave|avenue|blvd|road|rd\.|drive|dr\.|lane|ln\.|way|place|pl\./i;
const ADDRESS_PLACEHOLDER = "Address not listed";

function isGarbage(s: string): boolean {
  const t = s.trim();
  if (t.length < MIN_NAME_LEN) return true;
  return GARBAGE_PATTERNS.some((p) => p.test(t));
}

function sanitize(s: string, maxLen: number): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/[\r\n\t]/g, " ")
    .trim()
    .slice(0, maxLen);
}

export interface ValidatedRow {
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  lat: number;
  lon: number;
  mimosa_price: number | null;
  confirmation_score: number;
  source_urls: string[];
  scraped_snippet: string | null;
  dedupe_key: string;
}

const PHONE_PLACEHOLDER = "Not listed";

/** City center fallbacks when we don't have real coordinates (FL cities). */
export const CITY_CENTERS: Record<string, { lat: number; lon: number }> = {
  Tampa: { lat: 27.9506, lon: -82.4572 },
  Orlando: { lat: 28.5383, lon: -81.3792 },
  Miami: { lat: 25.7617, lon: -80.1918 },
  "St. Petersburg": { lat: 27.7676, lon: -82.6403 },
  "St Petersburg": { lat: 27.7676, lon: -82.6403 },
};

/**
 * Returns a validated, sanitized row or null if the data is invalid.
 */
export function validateVenueRow(
  raw: {
    name: string;
    address: string;
    city: string;
    state: string;
    phone: string;
    lat?: number;
    lon?: number;
    mimosa_price?: number | null;
    confirmation_score: number;
    source_urls: string[];
    scraped_snippet?: string | null;
    dedupe_key: string;
  },
  defaultLat: number,
  defaultLon: number
): ValidatedRow | null {
  const name = sanitize(raw.name, MAX_NAME);
  const address = sanitize(raw.address, MAX_ADDRESS);

  if (name.length < MIN_NAME_LEN || name.length > MAX_NAME) return null;
  if (address.length < MIN_ADDRESS_LEN || address.length > MAX_ADDRESS) return null;
  if (isGarbage(name) || isGarbage(address)) return null;
  if (address !== ADDRESS_PLACEHOLDER && !ADDRESS_LIKE.test(address)) return null;

  const city = sanitize(raw.city, 100) || raw.city;
  const state = (raw.state || "").trim().toUpperCase().slice(0, 2);
  if (!city || !state) return null;

  let phone = (raw.phone || "").trim();
  if (!phone || phone === "000-000-0000" || !/\d{3}/.test(phone)) {
    phone = PHONE_PLACEHOLDER;
  }
  phone = phone.slice(0, 30);

  const lat = typeof raw.lat === "number" && raw.lat !== 0 ? raw.lat : defaultLat;
  const lon = typeof raw.lon === "number" && raw.lon !== 0 ? raw.lon : defaultLon;

  const mimosa_price =
    typeof raw.mimosa_price === "number" && raw.mimosa_price >= 15 && raw.mimosa_price <= 99
      ? raw.mimosa_price
      : null;

  const scraped_snippet = raw.scraped_snippet
    ? sanitize(raw.scraped_snippet, MAX_SNIPPET)
    : null;

  return {
    name,
    address,
    city,
    state,
    phone,
    lat,
    lon,
    mimosa_price,
    confirmation_score: Math.min(5, Math.max(0, raw.confirmation_score)),
    source_urls: Array.isArray(raw.source_urls) ? raw.source_urls.slice(0, 10) : [raw.source_urls].filter(Boolean),
    scraped_snippet: scraped_snippet || null,
    dedupe_key: raw.dedupe_key,
  };
}
