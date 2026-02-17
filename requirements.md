````markdown
# FindBottomlessMimosas.com — MVP Engineering Requirements (Build Blueprint)

Version: 1.0  
Date: 2026-02-16  
Owner: FindBottomlessMimosas.com  
Scope: Full MVP specification for SEO-first directory + scraping ingestion + claiming + subscriptions + owner/admin dashboards

---

## 1. Goals, Non-Goals, and Success Criteria

### 1.1 Goals
- SEO-dominant directory for “bottomless mimosas” / equivalent brunch drink specials by **state subdomain → city → neighborhood**.
- Fast-path conversions:
  - **Call** venue (primary CTA).
  - **View deal / Reserve** (outbound to venue/reservation provider).
  - **Claim listing** (Stripe subscription).
- Automated weekly ingestion pipeline:
  - Scrape allowed sources via Firecrawl.
  - Score confidence, auto-publish confirmed listings, queue low-confidence for admin review.
- Owner portal:
  - Claim and manage venues.
  - Edit allowed fields.
  - View basic analytics (views/calls).
  - Manage billing via Stripe Customer Portal.
- Admin portal:
  - Approve/reject pending listings.
  - Handle flags/corrections.
  - Manage claims / manual featured overrides.
  - Trigger scraper manually.

### 1.2 Non-Goals (MVP)
- No Google Maps API or scraping.
- No scraping and rehosting photos; no long copied text from sources.
- No complex tiered pricing beyond monthly/annual.
- No end-user accounts/reviews.
- No real-time deal updates; content is “best-effort” and must encourage calling to confirm.

### 1.3 Success Criteria (MVP)
- Indexed city pages for initial cities (Tampa/Orlando/Miami/St. Petersburg).
- Listing detail pages with JSON-LD and canonical tags.
- Weekly scrape job produces:
  - Upserts without duplicates.
  - Confidence scoring and correct “confirmed vs pending” routing.
- Stripe subscription flow works:
  - 14-day trial.
  - Webhook updates featured eligibility after review gate.
- Owner portal supports claiming + editing + billing + analytics.
- Admin portal supports pending approval + flagged handling + manual run.

---

## 2. Tech Stack (Non-Negotiable)

### 2.1 Web
- Next.js 15, App Router only (`app/`), TypeScript only.
- Server Components by default; client components only where required (maps, filter UI state, auth forms).

### 2.2 UI
- Tailwind CSS.
- shadcn/ui components only (no other component libraries).
- Use Radix primitives only via shadcn.

### 2.3 Hosting & Ops
- Vercel deployment.
- Vercel Cron for `/api/scrape-mimosas`.
- Wildcard subdomains:
  - `findbottomlessmimosas.com`
  - `*.findbottomlessmimosas.com`
  - `my.findbottomlessmimosas.com`
- Environment variables managed in Vercel project settings.

### 2.4 Data & Auth
- Supabase Postgres + Supabase Auth.
- Email/password + Google OAuth.
- RLS enforced for all tables.

### 2.5 Payments
- Stripe Checkout for subscriptions:
  - $99/month recurring.
  - $990/year recurring.
  - 14-day free trial.
- Stripe Customer Portal enabled for billing management.
- Stripe webhooks handled by Next.js route.

### 2.6 Maps
- Leaflet + OpenStreetMap tiles.
- Cluster map on city pages.
- Listing detail page uses “Open in Maps” link.

### 2.7 Scraping
- Firecrawl API for server-side extraction.
- No local execution required (must run in Vercel environment via cron or admin action).

### 2.8 Email
- Resend for transactional + double opt-in.
- Email capture stored in Supabase.

### 2.9 Analytics
- Vercel Analytics only.
- No GA.
- Site-level event counters stored in Supabase (views/calls/searches) with anonymized logging.

---

## 3. URL Structure, Routing, and Domain Strategy

### 3.1 Required Hostnames
- National hub: `https://findbottomlessmimosas.com/`
- Near-me: `https://findbottomlessmimosas.com/near-me/`
- Admin: `https://findbottomlessmimosas.com/admin/`
- State subdomains: `https://fl.findbottomlessmimosas.com/`, etc.
- Owner portal: `https://my.findbottomlessmimosas.com/`

### 3.2 Route Patterns
**National**
- `/` — national hub (states + top cities + search)
- `/near-me` — GPS-based search with radius
- `/terms`, `/privacy`, `/contact`

**State subdomain (host-based routing)**
- `/` — state landing page (city index + featured)
- `/:citySlug/` — city page with map + listing list + filters + pagination
- `/:citySlug/:neighborhoodSlug/` — neighborhood page
- `/:citySlug/:venueSlug-:venueId/` — venue detail page (venueId is UUID suffix for uniqueness)

**Owner portal (host-based routing)**
- `/` → redirect `/venues`
- `/login`
- `/venues`
- `/venues/:id/edit`
- `/billing` (redirect to Stripe portal session)

**Admin (main domain)**
- `/admin`
- `/admin/pending`
- `/admin/flags`
- `/admin/claims`
- `/admin/scrape` (manual trigger)

### 3.3 Host-Based Routing Implementation
- Use Next.js `middleware.ts` to detect hostname and rewrite to internal route groups:
  - `fl.findbottomlessmimosas.com` → `/state/fl/...`
  - `my.findbottomlessmimosas.com` → `/my/...`
  - `findbottomlessmimosas.com` → `/www/...`

Example internal structure:
- `app/(www)/...`
- `app/(state)/state/[stateCode]/...`
- `app/(my)/my/...`

**Requirement:** External URL stays clean (no `/state/fl` in URL).

---

## 4. Information Architecture (Pages and User Journeys)

### 4.1 Pages (MVP Required)
- National hub: states, featured cities, search entry.
- State landing: top featured venues + city list + CTA to claim.
- City page:
  - Hero disclaimer
  - 3 featured listings
  - Map with clusters
  - Filter sidebar
  - List cards + pagination
- Neighborhood page: same template as city page with neighborhood constraint.
- Venue detail page:
  - Top CTAs: Call, Reserve/View Deal, Open in Maps, Claim
  - Deal evidence snippet + “via” attribution
  - Disclaimer
  - JSON-LD Restaurant
- Near-me page:
  - Request GPS
  - Fallback to state/city selection
  - Radius filter
  - Results list + map (optional; list required)
- Owner portal:
  - Login
  - My Venues table with statuses + analytics
  - Edit venue page
  - Billing management
- Admin portal:
  - Pending listings queue (approve/edit/reject)
  - Flags/corrections
  - Claims management
  - Scrape controls

### 4.2 Primary Conversion Paths
1) Direct Call: Listing card prominently displays click-to-call.
2) View Deal / Reserve: outbound tracked link.
3) Claim Listing: prompts business owners to subscribe and claim control.

---

## 5. Data Model (Supabase)

### 5.1 Extensions
- Enable PostGIS for near-me queries:
  - `CREATE EXTENSION IF NOT EXISTS postgis;`

### 5.2 Tables

#### 5.2.1 `public.mimosa_spots` (Primary)
Stores venue listings. Only confirmed or pending listings appear; “confirmed-only” is default.

**SQL**
```sql
create table if not exists public.mimosa_spots (
  id uuid primary key default gen_random_uuid(),

  -- location identity
  name text not null,
  state text not null,          -- "FL"
  city text not null,           -- "Tampa"
  neighborhood text null,       -- "Wesley Chapel"
  address text not null,
  lat double precision not null,
  lon double precision not null,
  phone text not null,

  -- deal data
  mimosa_price integer null check (mimosa_price is null or (mimosa_price between 15 and 99)),
  hours jsonb null,             -- { "sat":"10-3", "sun":"11-4" } (owner-editable)
  description text null,        -- owner-editable (<=150 chars enforced in app + db optional constraint)
  special_offer text null,
  deal_terms text null,

  -- scraping provenance
  confirmation_score integer not null default 0 check (confirmation_score between 0 and 5),
  scraped_at timestamptz not null default now(),
  source_urls text[] not null default '{}',
  scraped_snippet text null,    -- max 50 chars in app; optional db constraint below
  has_photos boolean not null default false,

  -- status & publishing
  human_reviewed boolean not null default false,
  is_published boolean not null default false,  -- true when confirmed OR manually approved
  featured boolean not null default false,      -- computed/controlled by claims + review

  -- claim/subscription links
  claimed_by uuid null references auth.users(id) on delete set null,
  trial_ends timestamptz null,
  stripe_customer_id text null,
  stripe_subscription_id text null,
  subscription_status text null, -- "trialing" | "active" | "past_due" | "canceled" etc.

  -- metrics
  views integer not null default 0,
  calls integer not null default 0,
  outbound_clicks integer not null default 0,

  -- flags/corrections
  flagged_at timestamptz null,
  flag_reason text null,

  -- system
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mimosa_spots_city_idx on public.mimosa_spots (state, city);
create index if not exists mimosa_spots_neighborhood_idx on public.mimosa_spots (state, city, neighborhood);
create index if not exists mimosa_spots_claimed_by_idx on public.mimosa_spots (claimed_by);
create index if not exists mimosa_spots_featured_idx on public.mimosa_spots (featured);
````

**Optional DB constraint for snippet length**

```sql
alter table public.mimosa_spots
  add constraint scraped_snippet_len check (scraped_snippet is null or char_length(scraped_snippet) <= 50);
```

**PostGIS generated column (optional but preferred)**

```sql
alter table public.mimosa_spots
  add column if not exists geom geography(point, 4326)
  generated always as (st_setsrid(st_makepoint(lon, lat), 4326)::geography) stored;

create index if not exists mimosa_spots_geom_gix on public.mimosa_spots using gist (geom);
```

#### 5.2.2 `public.claim_verifications`

Tracks evidence for “2 of 3” verification.

```sql
create table if not exists public.claim_verifications (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.mimosa_spots(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  phone_otp_verified boolean not null default false,
  business_email_verified boolean not null default false,
  menu_evidence_verified boolean not null default false,

  verified_at timestamptz null,
  created_at timestamptz not null default now()
);

create unique index if not exists claim_verifications_unique
  on public.claim_verifications (spot_id, user_id);
```

#### 5.2.3 `public.venue_edits_audit`

Audit owner edits (minimal for accountability).

```sql
create table if not exists public.venue_edits_audit (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.mimosa_spots(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  field_name text not null,
  old_value text null,
  new_value text null,
  created_at timestamptz not null default now()
);
```

#### 5.2.4 `public.flags`

Normalized issues reported by users.

```sql
create table if not exists public.flags (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.mimosa_spots(id) on delete cascade,
  reason text not null,
  details text null,
  reporter_email text null,
  status text not null default 'open', -- open | resolved | rejected
  created_at timestamptz not null default now(),
  resolved_at timestamptz null
);
```

#### 5.2.5 `public.email_subscribers`

Email capture for city guides.

```sql
create table if not exists public.email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  city text null,
  state text null,
  double_opt_in boolean not null default false,
  unsubscribed boolean not null default false,
  created_at timestamptz not null default now()
);
```

#### 5.2.6 `public.scrape_jobs` and `public.scrape_results`

Track runs and pending items.

```sql
create table if not exists public.scrape_jobs (
  id uuid primary key default gen_random_uuid(),
  state text not null,
  city text not null,
  source text not null, -- yelp | tripadvisor | blog
  status text not null default 'queued', -- queued | running | completed | failed
  started_at timestamptz null,
  completed_at timestamptz null,
  error text null,
  created_at timestamptz not null default now()
);

create table if not exists public.scrape_results (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.scrape_jobs(id) on delete cascade,
  raw jsonb not null,
  normalized jsonb null,
  created_at timestamptz not null default now()
);
```

---

## 6. Supabase RLS and Authorization Model

### 6.1 Roles

* Anonymous: can read published listings.
* Authenticated owner: can read their claimed listings; can edit allowed fields for claimed venues.
* Admin: full access + approval capabilities.

### 6.2 Admin Claim

Admin is identified via JWT custom claim: `app_role = "admin"`.

### 6.3 RLS: `mimosa_spots`

Enable RLS:

```sql
alter table public.mimosa_spots enable row level security;
```

Policies:

```sql
-- Public read: only published listings (confirmed or admin-approved)
create policy "public read published"
on public.mimosa_spots
for select
to anon, authenticated
using (is_published = true);

-- Owner read: allow owners to read their claimed listing regardless of publish state
create policy "owner read own"
on public.mimosa_spots
for select
to authenticated
using (claimed_by = auth.uid());

-- Owner update: only specific fields (enforced in app + db with column privileges)
-- Approach: use a SECURITY DEFINER RPC for edits, or restrict update and use RPC.
create policy "owner update own via rpc only"
on public.mimosa_spots
for update
to authenticated
using (false)
with check (false);

-- Admin full access
create policy "admin all"
on public.mimosa_spots
for all
to authenticated
using ((auth.jwt() ->> 'app_role') = 'admin')
with check ((auth.jwt() ->> 'app_role') = 'admin');
```

**Requirement:** Use RPC functions for owner edits to enforce field-level edits.

### 6.4 RPC: Owner Edit Venue Fields

Create a SECURITY DEFINER function that:

* Confirms `claimed_by = auth.uid()`
* Allows updating only:

  * `mimosa_price`
  * `deal_terms`
  * `hours`
  * `description`
  * `special_offer`
  * `website/reservation link` fields (add columns if needed; see Section 6.7)
  * `phone` only if verified workflow passed
* Writes audit rows

Example (expand in implementation):

```sql
create or replace function public.owner_update_spot(
  p_spot_id uuid,
  p_mimosa_price integer,
  p_hours jsonb,
  p_description text,
  p_deal_terms text,
  p_special_offer text
) returns void
language plpgsql
security definer
as $$
begin
  if not exists (
    select 1 from public.mimosa_spots
    where id = p_spot_id and claimed_by = auth.uid()
  ) then
    raise exception 'not authorized';
  end if;

  update public.mimosa_spots
    set mimosa_price = p_mimosa_price,
        hours = p_hours,
        description = p_description,
        deal_terms = p_deal_terms,
        special_offer = p_special_offer,
        updated_at = now()
  where id = p_spot_id;
end;
$$;
```

### 6.5 RLS: Flags

```sql
alter table public.flags enable row level security;

create policy "public insert flags"
on public.flags
for insert
to anon, authenticated
with check (true);

create policy "admin manage flags"
on public.flags
for all
to authenticated
using ((auth.jwt() ->> 'app_role') = 'admin')
with check ((auth.jwt() ->> 'app_role') = 'admin');
```

### 6.6 Chain Blocking Trigger

Block by substring match; admin can override via `allow_chain boolean` column (add).

Add field:

```sql
alter table public.mimosa_spots
  add column if not exists allow_chain boolean not null default false;
```

Trigger:

```sql
create or replace function public.block_chains()
returns trigger as $$
declare
  blocked boolean := false;
begin
  if new.allow_chain = true then
    return new;
  end if;

  if new.name ilike any (array[
    '%Applebee%', '%Chili%', '%Outback%', '%Buffalo Wild Wings%',
    '%IHOP%', '%Denny%', '%Perkins%'
  ]) then
    blocked := true;
  end if;

  if blocked then
    raise exception 'Chains not permitted';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists chains_block on public.mimosa_spots;

create trigger chains_block
before insert on public.mimosa_spots
for each row execute function public.block_chains();
```

### 6.7 Additional Fields Required for UX (Add to Table)

To support CTAs and affiliate tracking, add:

* `website_url text`
* `reservation_url text`
* `reservation_provider text` (e.g., openTable/resy/none)
* `call_to_action_note text` (e.g., “Call for mimosa availability”)

```sql
alter table public.mimosa_spots
  add column if not exists website_url text,
  add column if not exists reservation_url text,
  add column if not exists reservation_provider text,
  add column if not exists call_to_action_note text;
```

---

## 7. Scraping & Ingestion System

### 7.1 Inputs (MVP)

Approved cities list stored in code and/or table:

* Tampa, FL
* Orlando, FL
* Miami, FL
* St. Petersburg, FL

Optional neighborhoods are used for SEO pages and filtering but **scraping is city-level** initially.

### 7.2 Allowed Sources

* Yelp (primary)
* TripAdvisor
* Local blogs (SERP-like curated sources)

**Never scrape**

* Google Maps
* Restaurant sites directly

### 7.3 Firecrawl Extraction Contract

For each source query, Firecrawl extraction must return an array of candidate venues with:

* name
* address
* phone (if available)
* any detected price
* evidence snippet containing bottomless/unlimited language
* source_url
* detected_city/state if present
* any detected hours (optional)

**Constraint:** Store **only**:

* `source_url` list
* `scraped_snippet` limited to 50 characters
* no photos or full paragraphs

### 7.4 Confirmation Scoring Rules

Compute `confirmation_score` 0–5 using points:

* “bottomless mimosa” / “unlimited mimosas” / “endless mimosas” / “bottomless bubbles” / “bottomless brunch” text: +2
* price mention: +2
* brunch hours mention: +1
* mimosa image: +1 (if source signals a mimosa photo; do not store photo)

Publish routing:

* Score >= 3 → `is_published = true`, `human_reviewed = false`
* Score 1–2 → `is_published = false`, `human_reviewed = false` (pending queue)
* Score 0 → do not insert OR insert with `is_published=false` and `rejected=true` (MVP: do not insert)

### 7.5 De-duplication Rules

Idempotent upsert key:

* Use `name + address + city + state` normalized.
* Add computed column or unique index on normalized key.

Implementation:

* Add column `dedupe_key text unique`.
* Compute in ingestion.

```sql
alter table public.mimosa_spots add column if not exists dedupe_key text unique;
create unique index if not exists mimosa_spots_dedupe_key_uq on public.mimosa_spots (dedupe_key);
```

### 7.6 Cron Job

* Vercel Cron: Weekly Monday 2:00 AM America/New_York
* Target endpoint: `POST /api/scrape-mimosas` with shared secret header.

Vercel cron config (in `vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/scrape-mimosas",
      "schedule": "0 7 * * 1"
    }
  ]
}
```

Note: 2AM ET = 07:00 UTC during standard time; handle DST by choosing a consistent UTC schedule or accept DST drift. Requirement: Document chosen approach.

### 7.7 Scrape Flow (Server)

1. Validate auth header secret.
2. For each approved city:

   * Create `scrape_jobs` entries per source.
   * Execute Firecrawl extraction with source query URL(s).
   * Normalize candidates.
   * Score candidates.
   * Upsert into `mimosa_spots` with `dedupe_key`.
3. Summarize counts:

   * inserted, updated, published, pending
4. Notify admin (email via Resend) with counts.

### 7.8 Admin Manual Scrape Trigger

* `/admin/scrape` provides a button:

  * “Run scraper now”
  * Optionally choose city subset
* Calls server action or POST to the same route.

---

## 8. Search, Filters, Ranking, and Pagination

### 8.1 Default Ordering (City/Neighborhood)

1. Featured listings: `featured = true` (max 3 per city; see Section 9)
2. High confidence confirmed: `confirmation_score >= 4`
3. Confirmed with price: `confirmation_score >= 3 AND mimosa_price IS NOT NULL`
4. Basic confirmed: `confirmation_score >= 3`
5. Pending (optional toggle): `confirmation_score IN (1,2) AND is_published=false`

Tie-breaker: `name ASC`.

### 8.2 Rank Score Formula (Non-Featured)

Compute a deterministic rank score:

* `score = (confirmation_score * 40)        + (has_price * 20)        + (has_hours * 15)        + (recency * 10)        + (has_photos * 10)        + (city_match * 5)`

Definitions:

* `has_price` = 1 if `mimosa_price is not null` else 0
* `has_hours` = 1 if `hours is not null` else 0
* `recency` = `1 - min(days_since_scrape / 30, 1)` (fresh → higher)
* `has_photos` = 1/0
* `city_match` = 1 if exact city match else 0

MVP implementation:

* Compute in SQL projection and order by it.

### 8.3 Filter Requirements

City/neighborhood pages:

* Price range buckets: 15–20, 21–25, 26–35, 36+, unknown
* Day availability: Saturday / Sunday / Both (requires hours JSON support; if missing hours, include only when “unknown hours” bucket is enabled or ignore; MVP: include but do not allow day filtering when hours missing)
* Features/tags (MVP: tags come from scraping or owner edits; table column `tags text[]` required)
* Status toggle: confirmed-only (default on), show pending (off by default)
* Neighborhood selector (city pages)
  Near-me:
* Radius: 5, 10, 25, 50 miles, all
* Sort by distance then rank.

Add `tags`:

```sql
alter table public.mimosa_spots add column if not exists tags text[] not null default '{}';
create index if not exists mimosa_spots_tags_gin on public.mimosa_spots using gin(tags);
```

### 8.4 Search UI Requirements

* City page search: query param `?search=...` filtering within city scope by `name ILIKE` OR `description ILIKE` OR `deal_terms ILIKE`.
* Near-me autocomplete:

  * Suggest cities and neighborhoods (derived from existing published listings).
  * Provide counts next to suggestion.

### 8.5 Pagination

* 20 listings per page.
* Query param `?page=1`.
* Provide `rel="next"` and `rel="prev"`.
* Pages 3+:

  * `noindex, follow`
  * Keep canonical to `?page=1` or canonical to current page (choose one; requirement: implement consistent strategy)
* Featured listings always appear on page 1 only (MVP).

---

## 9. Claim Listing + Subscription Business Logic

### 9.1 Plans

* Monthly: $99/month recurring
* Annual: $990/year recurring
* 14-day trial for both
* Cancel anytime

### 9.2 Featured Placement Rules

* State page: Top 3 slots (state-wide featured)
* City page: Top 3 slots per city
* Neighborhood page: Top 1 slot per neighborhood

Tie-break:

* first paid, first served by `created_at` of active subscription claim.

Implementation:

* Determine “slots” via query:

  * `featured = true` and within scope
  * order by `featured_activated_at asc`

Add:

```sql
alter table public.mimosa_spots
  add column if not exists featured_activated_at timestamptz null;
```

### 9.3 Verification (2 of 3 required)

Methods:

1. Phone OTP match
2. Business email domain (not gmail/yahoo)
3. Menu evidence (URL with “brunch” or “mimosa” content)

Workflow:

* Owner clicks “Claim this listing”.
* If not logged in → redirect to `my.` login.
* In owner portal:

  * Start claim flow with `spot_id`.
  * Collect phone OTP:

    * Send OTP to the scraped phone number (via provider; MVP may stub with “manual admin OTP” if no SMS provider is configured; requirement: choose an SMS provider or implement admin-mediated OTP)
  * Collect business email:

    * Verify via magic link to email, or require Google OAuth with matching domain; MVP: email verification link via Supabase Auth + domain check.
  * Menu evidence:

    * Owner submits URL; admin or automated check verifies it contains “brunch” or “mimosa”.

Claim is granted when at least 2 checks pass. Store results in `claim_verifications`.

### 9.4 Stripe Checkout Flow

1. Owner selects monthly/annual.
2. Create Stripe Checkout session server-side with:

   * customer email
   * subscription data with trial period (14 days)
   * metadata: `spot_id`, `user_id`
3. Redirect to Stripe Checkout.
4. On success redirect to `/venues?success=1`
5. Webhook updates:

   * store `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, `trial_ends`.
   * mark listing “trial active” and temporarily show “featured trial” UI.

### 9.5 Trial Activation vs Full Activation

* Instant activation:

  * After successful checkout, mark:

    * `subscription_status = "trialing"`
    * `featured = true` OR `featured=true` with UI badge “Trial”
* Full activation after review:

  * On day 15 (trial end) webhook event + admin review status gates:

    * if admin approved claim and verification satisfied, keep featured “Gold Star”
    * else downgrade to free listing and set `featured=false`

Requirement:

* Implement an admin “Approve claim” action, which sets a field:

  * `claim_approved boolean`
  * `claim_approved_at`

Add:

```sql
alter table public.mimosa_spots
  add column if not exists claim_approved boolean not null default false,
  add column if not exists claim_approved_at timestamptz null;
```

---

## 10. UI Requirements (Components and Layout)

### 10.1 Global Layout

* Sticky top nav:

  * Logo
  * “Near me”
  * “Cities”
  * “Claim your spot”
* Footer includes:

  * Disclaimer
  * Links: Privacy, Terms, Contact
  * Data attribution statement

### 10.2 Listing Card (Critical)

Must render with hierarchy:

* Name + featured badge if featured
* Price bubble if available
* CTA buttons:

  * Primary: “CALL NOW” (`tel:`)
  * Secondary: “VIEW DEAL” / “RESERVE”
  * “MAP” or “OPEN IN MAPS”
  * “CLAIM THIS LISTING”
* Evidence snippet (max 50 chars) + attribution source domain
* “Pending verification” state style (grayed)

### 10.3 City Page

* Hero: city title + disclaimer banner text:

  * “Deals change hourly… CALL TO CONFIRM…”
* Map:

  * Leaflet cluster map
  * markers:

    * featured: highlighted
    * non-featured: standard
* Filters sidebar:

  * Controlled by URL query params
* List:

  * Featured section at top (3)
  * Remaining sorted list with pagination

### 10.4 Venue Detail Page

* Structured for SEO:

  * H1 name
  * Address
  * Phone + Call CTA
  * Deal info (price/hours/terms)
  * Evidence snippet + “via …”
  * Claim CTA (for owners)
  * JSON-LD script tag

### 10.5 Near-Me Page

* On load:

  * Prompt for geolocation
  * If denied, show fallback city selector + guidance
* Results:

  * Sort by distance then rank.
* Radius controls required.

### 10.6 Owner Portal

* `/my/login`:

  * Supabase Auth (email/password + Google)
* `/my/venues`:

  * Table:

    * Venue name
    * Status: trialing/active/past_due
    * Featured status
    * Views/calls
    * Trial days left
    * Actions: Edit, Billing
* `/my/venues/:id/edit`:

  * Editable fields only:

    * mimosa_price
    * deal_terms
    * hours
    * description (<=150 chars)
    * special_offer
    * website_url/reservation_url
    * phone only if verified path complete
  * Save uses RPC function
* `/my/billing`:

  * Create portal session server-side → redirect

### 10.7 Admin Portal

Protected by middleware and admin claim.
Pages:

* `/admin/pending`:

  * list pending listings (score 1–2)
  * actions: approve (set `is_published=true`, `human_reviewed=true`), edit, reject
* `/admin/flags`:

  * list open flags
  * actions: resolve, reject, apply edits
* `/admin/claims`:

  * list claimed listings
  * actions: approve claim, revoke claim
* `/admin/scrape`:

  * run now
  * view last run stats

---

## 11. API Routes & Server Actions

### 11.1 `/api/scrape-mimosas` (POST)

Purpose:

* Cron endpoint to run ingestion.

Requirements:

* Auth via header `x-cron-secret`.
* For each city/source:

  * Firecrawl extraction
  * Normalize + score
  * Upsert
* Return JSON summary.

### 11.2 `/api/stripe-webhook` (POST)

Purpose:

* Receive Stripe events:

  * `checkout.session.completed`
  * `customer.subscription.updated`
  * `customer.subscription.deleted`
  * `invoice.payment_failed`
  * `invoice.paid`

Requirements:

* Verify Stripe signature.
* Use metadata to find `spot_id`.
* Update subscription columns and trial end.
* Apply downgrade on cancel/payment failure:

  * `featured=false`
  * `subscription_status` update

### 11.3 `/api/stripe/create-checkout-session` (POST)

Purpose:

* Start claim subscription for a listing.

Requirements:

* Auth required (Supabase session).
* Validate claim verification state or allow payment before verification (MVP: allow payment → trial, but require verification before full activation).
* Create Stripe checkout session with metadata.

### 11.4 `/api/stripe/create-portal-session` (POST)

Purpose:

* Owner billing management.
* Auth required.

### 11.5 `/api/metrics/call` (POST)

Purpose:

* Increment call counter when user clicks call CTA (client fires event before initiating tel link; best effort).

### 11.6 `/api/metrics/outbound` (POST)

Purpose:

* Increment outbound click counter.

### 11.7 `/api/flags` (POST)

Purpose:

* Create a flag/correction issue.

---

## 12. SEO Implementation Plan

### 12.1 Rendering Strategy

* City, neighborhood, and venue pages:

  * Server-rendered.
  * Prefer static generation where possible.

### 12.2 `generateStaticParams` and Dynamic Params

* Generate known city/neighborhood paths from Supabase at build time is not feasible by default on Vercel builds unless using build-time secrets and stable data.
  MVP strategy:
* Use dynamic rendering with caching (`revalidate`) or static generation for seeded cities in code.

Requirement:

* Implement ISR:

  * City pages: `export const revalidate = 3600;` (1 hour) or 86400 (daily)
  * Venue pages: same

### 12.3 JSON-LD

* City pages:

  * `ItemList` schema referencing venue URLs.
* Venue pages:

  * `Restaurant` schema (Schema.org) including:

    * name, address, geo, telephone, url
    * `servesCuisine` optional
    * `openingHoursSpecification` from `hours` if present
    * `offers` for mimosa deal if price present (structured minimally)

### 12.4 Sitemap

* Use `next-sitemap`.
* Must include:

  * National hub
  * near-me
  * state landing pages
  * city pages
  * neighborhood pages
  * venue pages

### 12.5 Robots

* `public/robots.txt` must:

  * disallow `/admin`
  * disallow `/my`
  * disallow `/api`
  * allow city/venue pages

### 12.6 Canonical Tags

* Canonical on:

  * city pages with filters/pagination should canonicalize to base city path + page param policy.
* Filter URLs:

  * Allow indexing base city page only.
  * Set `noindex, follow` when filters are applied (MVP) to prevent duplicate content explosion.

### 12.7 Breadcrumb Structured Data

* On state/city/neighborhood/venue:

  * Home > State > City > Neighborhood (optional) > Venue.

### 12.8 Metadata

* Each city page:

  * Title format: `Bottomless Mimosas in {City}, {State} (Confirmed Spots)`
  * Description includes disclaimer and call to confirm.
* Venue page:

  * Title: `{Venue} Bottomless Mimosas in {City}, {State}`
  * Description: include price if known, plus disclaimer.

---

## 13. Legal, Compliance, and Content Policy

### 13.1 Required Disclaimer (Exact)

Must appear:

* City hero banner
* Below each listing card
* Site-wide footer

Text:

> "🍹 Deals change hourly. Prices/availability shown from public sources. CALL TO CONFIRM before heading out. We're a directory, not your reservation desk."

### 13.2 Copyright

* Store only:

  * source URLs
  * short snippets (<=50 chars)
* No scraped photos.
* Use:

  * venue logos only if owner provides (MVP optional)
  * otherwise stock imagery

### 13.3 Takedown & Corrections

* “Report Issue” on every listing:

  * Modal with reasons:

    * wrong price
    * closed
    * no mimosas
    * other
  * Submits to `flags` table and emails `corrections@findbottomlessmimosas.com`.

### 13.4 Age Notice

* No hard gate.
* Collapsible banner: “21+ to drink.”

### 13.5 Privacy

* Near-me GPS:

  * client-side only; never stored.
* IP fallback:

  * use edge headers to infer city (no persistent storage).
* Cookie consent:

  * banner for compliance.
* Analytics:

  * Vercel only; no GA.

---

## 14. Deployment Instructions (Vercel + Supabase + Stripe)

### 14.1 DNS

* Apex: `findbottomlessmimosas.com`
* Wildcard: `*.findbottomlessmimosas.com`
* Subdomain: `my.findbottomlessmimosas.com`
* Ensure Vercel project is configured to accept wildcard domains.

### 14.2 Environment Variables (Vercel)

Required:

* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `SUPABASE_SERVICE_ROLE_KEY` (server-only)
* `STRIPE_SECRET_KEY`
* `STRIPE_WEBHOOK_SECRET`
* `STRIPE_PRICE_ID_MONTHLY`
* `STRIPE_PRICE_ID_ANNUAL`
* `CRON_SECRET`
* `FIRECRAWL_API_KEY`
* `RESEND_API_KEY`
* `CORRECTIONS_INBOX_EMAIL` (e.g., corrections@...)

### 14.3 Supabase Setup

* Create project.
* Enable PostGIS.
* Run SQL migrations:

  * tables
  * indices
  * triggers
  * RLS
  * RPC functions
* Configure Auth:

  * Google OAuth provider
  * Redirect URLs for:

    * main domain
    * state subdomains (if needed)
    * `my.` subdomain

### 14.4 Stripe Setup

* Create products/prices:

  * monthly $99
  * annual $990
* Enable customer portal.
* Configure webhook endpoint:

  * `https://findbottomlessmimosas.com/api/stripe-webhook`
* Ensure metadata on checkout session includes `spot_id` and `user_id`.

### 14.5 Vercel Cron

* Configure cron schedule for `/api/scrape-mimosas`.
* Protect endpoint with `CRON_SECRET`.

---

## 15. Folder Structure (Required)

The repository must match this structure (internal route groups allowed):

```
app/
├── (www)/
│   ├── page.tsx
│   ├── near-me/
│   │   └── page.tsx
│   ├── terms/
│   │   └── page.tsx
│   ├── privacy/
│   │   └── page.tsx
│   ├── contact/
│   │   └── page.tsx
│   └── admin/
│       ├── page.tsx
│       ├── pending/
│       │   └── page.tsx
│       ├── flags/
│       │   └── page.tsx
│       ├── claims/
│       │   └── page.tsx
│       └── scrape/
│           └── page.tsx
├── (state)/
│   └── state/
│       └── [stateCode]/
│           ├── page.tsx
│           └── [citySlug]/
│               ├── page.tsx
│               └── [neighborhoodSlug]/
│                   └── page.tsx
│               └── venue/
│                   └── [venueSlug]/
│                       └── page.tsx
├── (my)/
│   └── my/
│       ├── login/
│       │   └── page.tsx
│       ├── venues/
│       │   └── page.tsx
│       ├── venues/
│       │   └── [id]/
│       │       └── edit/
│       │           └── page.tsx
│       └── billing/
│           └── page.tsx
├── api/
│   ├── scrape-mimosas/
│   │   └── route.ts
│   ├── stripe-webhook/
│   │   └── route.ts
│   ├── stripe/
│   │   ├── create-checkout-session/
│   │   │   └── route.ts
│   │   └── create-portal-session/
│   │       └── route.ts
│   ├── flags/
│   │   └── route.ts
│   └── metrics/
│       ├── call/
│       │   └── route.ts
│       └── outbound/
│           └── route.ts
├── globals.css
├── layout.tsx
middleware.ts
lib/
├── supabase/
│   ├── server.ts
│   ├── client.ts
│   └── admin.ts
├── stripe/
│   └── stripe.ts
├── seo/
│   ├── jsonld.ts
│   └── sitemap.ts
└── scraping/
    ├── firecrawl.ts
    ├── normalize.ts
    ├── score.ts
    └── dedupe.ts
components/
└── (shadcn ui + app components)
```

Requirement: The physical folder layout may vary slightly, but the routing behavior and endpoints must match.

---

## 16. Implementation Notes (Hard Constraints)

* No `pages/` directory.
* No other UI component libraries.
* No Google Maps.
* No client-only city pages; city/neighborhood pages must be server-rendered.
* Supabase is the only data store; no local JSON as source of truth.
* Scraping runs only in server environment (cron/admin).
* Strictly respect copyright constraints (no photo scraping, no long text).

---

## 17. Open Decisions That Must Be Resolved in Code (MVP Defaults)

1. SMS provider for phone OTP:

   * If none configured, implement “admin-mediated OTP” as an interim tool.
2. ISR `revalidate` values:

   * Default city pages: 1 hour
   * Venue pages: 6 hours
3. Canonical/pagination strategy:

   * Default: canonical `?page=1`, `noindex` pages 3+.

These defaults must be documented in code comments and in README.

---

## 18. Acceptance Checklist (Definition of Done)

* [ ] All required pages exist and route correctly by hostname.
* [ ] City pages render with:

  * filters
  * featured
  * map
  * pagination
  * disclaimer
* [ ] Venue detail pages exist with Restaurant JSON-LD.
* [ ] State landing pages show Top 3 featured.
* [ ] Scraper endpoint works with Firecrawl and upserts to Supabase.
* [ ] Confirmation scoring routes listings to published vs pending.
* [ ] Admin pending queue approves/rejects.
* [ ] Stripe checkout + webhook updates subscription state.
* [ ] Owner portal can claim (trial) and edit allowed fields via RPC.
* [ ] RLS prevents unauthorized edits.
* [ ] Sitemap + robots + canonical implemented.
* [ ] Cookie consent banner present.
* [ ] No scraped photos stored/displayed.

```
```
