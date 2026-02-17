import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Build dedupe key for mimosa_spots: name + address + city + state normalized */
export function buildDedupeKey(name: string, address: string, city: string, state: string): string {
  const n = (name || "").toLowerCase().replace(/\s+/g, " ").trim();
  const a = (address || "").toLowerCase().replace(/\s+/g, " ").trim();
  const c = (city || "").toLowerCase().replace(/\s+/g, " ").trim();
  const s = (state || "").toUpperCase().trim();
  return [n, a, c, s].filter(Boolean).join("|");
}

/** Slug from string (for city/neighborhood/venue URLs) */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
