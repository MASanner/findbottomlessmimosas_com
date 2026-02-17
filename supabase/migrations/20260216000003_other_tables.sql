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

create table if not exists public.venue_edits_audit (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.mimosa_spots(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  field_name text not null,
  old_value text null,
  new_value text null,
  created_at timestamptz not null default now()
);

create table if not exists public.flags (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.mimosa_spots(id) on delete cascade,
  reason text not null,
  details text null,
  reporter_email text null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz null
);

create table if not exists public.email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  city text null,
  state text null,
  double_opt_in boolean not null default false,
  unsubscribed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.scrape_jobs (
  id uuid primary key default gen_random_uuid(),
  state text not null,
  city text not null,
  source text not null,
  status text not null default 'queued',
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
