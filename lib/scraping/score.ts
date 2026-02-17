/** Confirmation score 0–5 per requirements Section 7.4 */

const MIMOSA_PHRASES = [
  "bottomless mimosa",
  "unlimited mimosas",
  "endless mimosas",
  "bottomless bubbles",
  "bottomless brunch",
];
const PRICE_PATTERN = /\$?\d{1,2}(\.\d{2})?|\d{1,2}\s*dollars?/i;
const BRUNCH_HOURS = /brunch|(\d{1,2}\s*[-–]\s*\d{1,2})|(sat|sun|weekend)/i;
const MIMOSA_IMAGE = /mimosa.*(photo|image|picture|img)|(photo|image).*mimosa/i;

export interface ScoredCandidate {
  name: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  price?: number;
  evidenceSnippet?: string;
  sourceUrl: string;
  hours?: string;
  score: number;
  hasPrice: boolean;
  hasBrunchHours: boolean;
  hasMimosaText: boolean;
  hasMimosaImage: boolean;
}

export function scoreCandidate(
  text: string,
  candidate: { name: string; address: string; city: string; state: string; phone?: string; price?: number; sourceUrl: string; hours?: string }
): ScoredCandidate {
  const lower = text.toLowerCase();
  let score = 0;
  const hasMimosaText = MIMOSA_PHRASES.some((p) => lower.includes(p));
  if (hasMimosaText) score += 2;
  const hasPrice = candidate.price != null || PRICE_PATTERN.test(text);
  if (hasPrice) score += 2;
  const hasBrunchHours = !!candidate.hours || BRUNCH_HOURS.test(text);
  if (hasBrunchHours) score += 1;
  const hasMimosaImage = MIMOSA_IMAGE.test(text);
  if (hasMimosaImage) score += 1;

  const snippetMatch = text.match(new RegExp(MIMOSA_PHRASES.join("|") + ".{0,30}", "i"));
  const evidenceSnippet = snippetMatch ? snippetMatch[0].slice(0, 50) : undefined;

  return {
    ...candidate,
    score: Math.min(5, score),
    hasPrice,
    hasBrunchHours,
    hasMimosaText,
    hasMimosaImage,
    evidenceSnippet,
  };
}
