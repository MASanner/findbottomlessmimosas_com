-- Sample data for local/demo. Run in Supabase SQL Editor after migrations.
-- Uses ON CONFLICT do nothing so you can run multiple times (dedupe_key unique).

INSERT INTO public.mimosa_spots (
  name, state, city, neighborhood, address, lat, lon, phone,
  mimosa_price, hours, scraped_snippet, source_urls, confirmation_score,
  is_published, human_reviewed, dedupe_key
) VALUES
  ('The Brunch Spot', 'FL', 'Tampa', NULL, '1600 E 8th Ave', 27.9506, -82.4572, '813-555-0101',
   25, '{"sat":"10-2","sun":"10-3"}'::jsonb, 'Bottomless mimosas on weekends', array['https://example.com/1'], 4,
   true, false, 'the brunch spot|1600 e 8th ave|tampa|FL'),
  ('Rooftop Mimosa Bar', 'FL', 'Tampa', 'Ybor City', '1901 E 7th Ave', 27.9589, -82.4365, '813-555-0102',
   29, '{"sat":"11-3","sun":"11-3"}'::jsonb, 'Unlimited mimosas with brunch', array['https://example.com/2'], 4,
   true, false, 'rooftop mimosa bar|1901 e 7th ave|tampa|FL'),
  ('Sunrise Cafe', 'FL', 'Tampa', NULL, '4202 S MacDill Ave', 27.9012, -82.5123, '813-555-0103',
   22, NULL, 'Bottomless brunch specials', array['https://example.com/3'], 3,
   true, false, 'sunrise cafe|4202 s macdill ave|tampa|FL'),
  ('Orlando Mimosa House', 'FL', 'Orlando', NULL, '7500 W Sand Lake Rd', 28.4506, -81.4682, '407-555-0201',
   27, '{"sat":"9-2","sun":"9-2"}'::jsonb, 'Endless mimosas Saturday & Sunday', array['https://example.com/4'], 4,
   true, false, 'orlando mimosa house|7500 w sand lake rd|orlando|FL'),
  ('Downtown Brunch Co', 'FL', 'Orlando', NULL, '55 E Church St', 28.5413, -81.3789, '407-555-0202',
   NULL, '{"sun":"10-4"}'::jsonb, 'Bottomless bubbles brunch', array['https://example.com/5'], 3,
   true, false, 'downtown brunch co|55 e church st|orlando|FL'),
  ('South Beach Mimosa', 'FL', 'Miami', 'South Beach', '1200 Ocean Dr', 25.7817, -80.1300, '305-555-0301',
   35, '{"sat":"11-4","sun":"11-4"}'::jsonb, 'Unlimited mimosas with view', array['https://example.com/6'], 4,
   true, false, 'south beach mimosa|1200 ocean dr|miami|FL'),
  ('Bayside Brunch', 'FL', 'Miami', NULL, '401 Biscayne Blvd', 25.7785, -80.1864, '305-555-0302',
   28, NULL, 'Bottomless mimosas', array['https://example.com/7'], 3,
   true, false, 'bayside brunch|401 biscayne blvd|miami|FL'),
  ('St Pete Beach House', 'FL', 'St Petersburg', NULL, '6800 Gulf Blvd', 27.7392, -82.7512, '727-555-0401',
   24, '{"sat":"10-2","sun":"10-2"}'::jsonb, 'Weekend bottomless mimosas', array['https://example.com/8'], 4,
   true, false, 'st pete beach house|6800 gulf blvd|st petersburg|FL'),
  ('Central Ave Kitchen', 'FL', 'St Petersburg', NULL, '2444 Central Ave', 27.7676, -82.6403, '727-555-0402',
   26, '{"sun":"11-3"}'::jsonb, 'Brunch with unlimited mimosas', array['https://example.com/9'], 3,
   true, false, 'central ave kitchen|2444 central ave|st petersburg|FL')
ON CONFLICT (dedupe_key) DO NOTHING;
