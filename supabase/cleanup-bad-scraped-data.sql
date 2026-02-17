-- One-time cleanup: remove rows that look like scraper junk (UI text, malformed data).
-- Run this in Supabase SQL Editor after fixing the scraper, then re-run the scraper if needed.

-- Delete where name is clearly UI/nav (adjust pattern as needed)
DELETE FROM public.mimosa_spots
WHERE
  name ~* '^(sort|filter|sign in|privacy|terms|cookie|©|loading|search|view all|see more|page [0-9]|people also)'
  OR name ~* 'https?://'
  OR name ~* '^www\.'
  OR length(trim(name)) < 2
  OR length(trim(name)) > 250;

-- Delete where address has no number (unlikely real address)
DELETE FROM public.mimosa_spots
WHERE address !~ '\d'
  AND address !~* '(street|st\.|avenue|ave|blvd|road|rd\.|drive|dr\.|lane|way|place)';

-- Delete where phone is placeholder and name/address look generic
DELETE FROM public.mimosa_spots
WHERE phone IN ('000-000-0000', '0000000000')
  AND length(name) < 5
  AND confirmation_score < 3;

-- Optional: set phone to 'Not listed' where it's the old placeholder
UPDATE public.mimosa_spots
SET phone = 'Not listed'
WHERE phone IN ('000-000-0000', '0000000000');
