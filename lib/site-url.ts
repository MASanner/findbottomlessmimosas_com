/**
 * Base origin for the main site. Set in .env.local for local dev.
 * - Local:  NEXT_PUBLIC_SITE_ORIGIN=http://localhost:3000
 * - Prod:  leave unset
 */
const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://findbottomlessmimosas.com").replace(/\/$/, "");
const IS_LOCAL = SITE_ORIGIN.includes("localhost") || SITE_ORIGIN.includes("127.0.0.1");

/** e.g. http://localhost:3000 or https://findbottomlessmimosas.com */
export function getSiteOrigin(): string {
  return SITE_ORIGIN;
}

/** Owner portal: http://my.localhost:3000 (local) or https://my.findbottomlessmimosas.com (prod) */
export function getOwnerPortalUrl(): string {
  if (IS_LOCAL) {
    const port = SITE_ORIGIN.match(/:(\d+)$/)?.[1] ?? "3000";
    return `http://my.localhost:${port}`;
  }
  return "https://my.findbottomlessmimosas.com";
}

/** State subdomain: http://fl.localhost:3000 (local) or https://fl.findbottomlessmimosas.com (prod) */
export function getStateUrl(stateCode: string): string {
  if (IS_LOCAL) {
    const port = SITE_ORIGIN.match(/:(\d+)$/)?.[1] ?? "3000";
    return `http://${stateCode.toLowerCase()}.localhost:${port}`;
  }
  return `https://${stateCode.toLowerCase()}.findbottomlessmimosas.com`;
}
