# FindBottomlessMimosas.com — MVP

Next.js 15 (App Router) + TypeScript directory for bottomless mimosas with hostname-based routing, Supabase, Stripe, and Firecrawl scraping.

## Setup

1. **Clone and install**
   ```bash
   cd findbottomlessmimosas_com
   npm install
   ```

2. **Environment variables**  
   Copy `.env.example` to `.env.local` and set:

   - **Local dev only:** `NEXT_PUBLIC_SITE_ORIGIN=http://localhost:3000` so “Florida” and “Claim your spot” point to `fl.localhost` and `my.localhost` instead of the live domain. Leave unset in production.

   - **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_ANNUAL`
   - **Cron**: `CRON_SECRET` (protects `/api/scrape-mimosas`)
   - **Firecrawl**: `FIRECRAWL_API_KEY`
   - **Resend**: `RESEND_API_KEY`, `CORRECTIONS_INBOX_EMAIL`

3. **Supabase migrations**  
   In the Supabase SQL editor (or via CLI), run the migrations in order:

   - `supabase/migrations/20260216000001_extensions.sql`
   - `supabase/migrations/20260216000002_mimosa_spots.sql`
   - `supabase/migrations/20260216000003_other_tables.sql`
   - `supabase/migrations/20260216000004_rls.sql`
   - `supabase/migrations/20260216000005_rpc_trigger.sql`
   - `supabase/migrations/20260216000006_metrics_rpc.sql`

   Or with Supabase CLI: `supabase db push` (from project linked to your Supabase project).

4. **Sample data (optional)**  
   To get listings on city pages without running the scraper, run the seed in Supabase **SQL Editor**:
   - Open `supabase/seed.sql`, copy its contents, paste into a new query, run.
   - This inserts 9 sample spots across Tampa, Orlando, Miami, and St. Petersburg. Safe to run more than once (uses `ON CONFLICT DO NOTHING`).

5. **Run locally**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). After seeding, try [http://fl.localhost:3000/tampa](http://fl.localhost:3000/tampa).

## Hostname routing (local testing)

External URLs stay clean; middleware rewrites by host:

- **Main**: `findbottomlessmimosas.com` → `/www/...` (hub, near-me, terms, privacy, contact, admin)
- **State**: `fl.findbottomlessmimosas.com` → `/state/fl/...` (state landing, city, neighborhood, venue)
- **Owner**: `my.findbottomlessmimosas.com` → `/my/...` (login, venues, edit, billing)

To test state and owner locally, add to your **hosts** file (e.g. `C:\Windows\System32\drivers\etc\hosts` or `/etc/hosts`):

```
127.0.0.1   fl.localhost
127.0.0.1   my.localhost
```

Then open:

- [http://fl.localhost:3000](http://fl.localhost:3000) for Florida state
- [http://fl.localhost:3000/tampa](http://fl.localhost:3000/tampa) for Tampa city
- [http://my.localhost:3000](http://my.localhost:3000) for owner portal (redirects to `/venues`)

## Stripe webhook (local)

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli) and login.
2. Forward events to your app:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```
3. Use the printed webhook signing secret as `STRIPE_WEBHOOK_SECRET` in `.env.local`.
4. Trigger test events (e.g. `checkout.session.completed`) from the Stripe Dashboard or CLI.

## Scraper URLs

Add URLs to scrape in **`app/api/scrape-mimosas/route.ts`**: edit the **`SOURCE_URLS_BY_CITY`** object. Each city (Tampa, Orlando, Miami, St. Petersburg) has an array of URLs; Firecrawl will fetch each URL and the pipeline will extract and score candidates. Use search/list pages for “bottomless mimosas [city]” (e.g. Yelp or TripAdvisor search results). The built-in parser is minimal—you may need to extend `Firecrawl v2 JSON extraction` for a given site’s HTML/markdown structure.

Raw extraction is stored in **`scrape_raw`** (run migration `20260216000007_scrape_raw.sql`). Call **`POST /api/scrape-mimosas/reprocess`** (same `x-cron-secret`) to re-run normalize/score/validate from stored data without calling Firecrawl again.

## Vercel cron

Scraper runs weekly (Monday 07:00 UTC) via `vercel.json` targeting `POST /api/scrape-mimosas`.  
Protected by `x-cron-secret: CRON_SECRET`.  
Cron time: 2:00 AM America/New_York (EST) is 07:00 UTC; DST shifts the local time (e.g. 3 AM EDT). Document in your runbook.

## Implementation checklist

| Area | Status | Notes |
|------|--------|--------|
| Next.js 15 App Router + TypeScript | ✅ | No `pages/` |
| Hostname routing (www / state / my) | ✅ | `middleware.ts` rewrites |
| Supabase schema + RLS + RPC + triggers | ✅ | Migrations in `supabase/migrations/` |
| Stripe Checkout + webhook + portal | ✅ | Trial 14 days; webhook updates `mimosa_spots` |
| Firecrawl scrape + score + upsert | ✅ | `POST /api/scrape-mimosas`; cron-protected |
| City/neighborhood/venue SSR | ✅ | ISR revalidate 3600 |
| Leaflet + OSM map on city page | ✅ | Markers; no Google Maps |
| Filters, ranking, pagination, URL params | ✅ | Price, neighborhood, search, showPending |
| JSON-LD (Restaurant + ItemList) | ✅ | Venue + city sitemap |
| Sitemap + robots.txt + canonical | ✅ | `app/sitemap.ts`, `app/robots.ts`, `public/robots.txt` |
| Admin (pending/flags/claims/scrape) | ✅ | Page shells; admin actions wire to Supabase (approve/reject, run scrape) |
| Owner (login/venues/edit/billing) | ✅ | Page shells; Auth + RPC edit + portal redirect |
| API: flags, metrics (call/outbound) | ✅ | `POST /api/flags`, `/api/metrics/call`, `/api/metrics/outbound` |
| Cookie consent banner | ✅ | Bottom banner; accept stores in localStorage |
| Resend email (scrape summary, corrections) | ⏳ | Env set; send calls to be wired |
| Near-me GPS + radius + autocomplete | ⏳ | Page and API stub; wire to PostGIS + client GPS |
| SMS/OTP for claim verification | ⏳ | MVP: admin-mediated OTP or stub |

## Assumptions (MVP)

- **Canonical/pagination**: Canonical for city is base path; `noindex, follow` for page ≥ 3 (documented in code).
- **ISR**: City/venue revalidate 3600 (1 hour); venue 6h possible per requirements.
- **Phone OTP**: No SMS provider configured → use admin-mediated OTP or stub in owner claim flow.
