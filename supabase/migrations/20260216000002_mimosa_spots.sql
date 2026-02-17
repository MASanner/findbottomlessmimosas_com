create table if not exists public.mimosa_spots (
  id uuid primary key default gen_random_uuid(),

  -- location identity
  name text not null,
  state text not null,
  city text not null,
  neighborhood text null,
  address text not null,
  lat double precision not null,
  lon double precision not null,
  phone text not null,

  -- deal data
  mimosa_price integer null check (mimosa_price is null or (mimosa_price between 15 and 99)),
  hours jsonb null,
  description text null,
  special_offer text null,
  deal_terms text null,

  -- scraping provenance
  confirmation_score integer not null default 0 check (confirmation_score between 0 and 5),
  scraped_at timestamptz not null default now(),
  source_urls text[] not null default '{}',
  scraped_snippet text null,
  has_photos boolean not null default false,

  -- status & publishing
  human_reviewed boolean not null default false,
  is_published boolean not null default false,
  featured boolean not null default false,

  -- claim/subscription links
  claimed_by uuid null references auth.users(id) on delete set null,
  trial_ends timestamptz null,
  stripe_customer_id text null,
  stripe_subscription_id text null,
  subscription_status text null,

  -- metrics
  views integer not null default 0,
  calls integer not null default 0,
  outbound_clicks integer not null default 0,

  -- flags/corrections
  flagged_at timestamptz null,
  flag_reason text null,

  -- system
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- dedupe (Section 7.5)
  dedupe_key text null,

  -- UX / CTA (Section 6.7)
  website_url text null,
  reservation_url text null,
  reservation_provider text null,
  call_to_action_note text null,

  -- chain blocking (Section 6.6)
  allow_chain boolean not null default false,

  -- tags (Section 8.3)
  tags text[] not null default '{}',

  -- featured slot ordering (Section 9.2)
  featured_activated_at timestamptz null,

  -- claim approval (Section 9.5)
  claim_approved boolean not null default false,
  claim_approved_at timestamptz null
);

alter table public.mimosa_spots
  add constraint scraped_snippet_len check (scraped_snippet is null or char_length(scraped_snippet) <= 50);

create unique index if not exists mimosa_spots_dedupe_key_uq on public.mimosa_spots (dedupe_key) where dedupe_key is not null;
create index if not exists mimosa_spots_city_idx on public.mimosa_spots (state, city);
create index if not exists mimosa_spots_neighborhood_idx on public.mimosa_spots (state, city, neighborhood);
create index if not exists mimosa_spots_claimed_by_idx on public.mimosa_spots (claimed_by);
create index if not exists mimosa_spots_featured_idx on public.mimosa_spots (featured);
create index if not exists mimosa_spots_tags_gin on public.mimosa_spots using gin(tags);

-- PostGIS
alter table public.mimosa_spots
  add column if not exists geom geography(point, 4326)
  generated always as (st_setsrid(st_makepoint(lon, lat), 4326)::geography) stored;

create index if not exists mimosa_spots_geom_gix on public.mimosa_spots using gist (geom);
