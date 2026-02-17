export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface MimosaSpot {
  id: string;
  name: string;
  state: string;
  city: string;
  neighborhood: string | null;
  address: string;
  lat: number;
  lon: number;
  phone: string;
  mimosa_price: number | null;
  hours: Json | null;
  description: string | null;
  special_offer: string | null;
  deal_terms: string | null;
  confirmation_score: number;
  scraped_at: string;
  source_urls: string[];
  scraped_snippet: string | null;
  has_photos: boolean;
  human_reviewed: boolean;
  is_published: boolean;
  featured: boolean;
  claimed_by: string | null;
  trial_ends: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  views: number;
  calls: number;
  outbound_clicks: number;
  flagged_at: string | null;
  flag_reason: string | null;
  created_at: string;
  updated_at: string;
  dedupe_key: string | null;
  website_url: string | null;
  reservation_url: string | null;
  reservation_provider: string | null;
  call_to_action_note: string | null;
  allow_chain: boolean;
  tags: string[];
  featured_activated_at: string | null;
  claim_approved: boolean;
  claim_approved_at: string | null;
}

export interface Flag {
  id: string;
  spot_id: string;
  reason: string;
  details: string | null;
  reporter_email: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export interface ScrapeJob {
  id: string;
  state: string;
  city: string;
  source: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  created_at: string;
}
