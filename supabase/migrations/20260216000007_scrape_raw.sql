-- Store raw extracted data per URL so we can re-run normalization without hitting Firecrawl again.
create table if not exists public.scrape_raw (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  city text not null,
  state text not null,
  scraped_at timestamptz not null default now(),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists scrape_raw_scraped_at on public.scrape_raw (scraped_at desc);
create index if not exists scrape_raw_url on public.scrape_raw (url);

comment on table public.scrape_raw is 'Raw Firecrawl extraction per URL; reprocess runs normalize/score/validate from payload without re-scraping.';
