import type { MimosaSpot } from "@/lib/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

const PER_PAGE = 20;

export interface CityFilters {
  page?: number;
  search?: string;
  priceBucket?: string;
  neighborhood?: string;
  showPending?: boolean;
}

export async function getSpotsByCity(
  stateCode: string,
  cityName: string,
  filters: CityFilters,
  neighborhood?: string | null
): Promise<{ spots: MimosaSpot[]; total: number; featured: MimosaSpot[] }> {
  const supabase = createAdminClient();
  const state = stateCode.toUpperCase();
  const city = cityName.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const page = Math.max(1, filters.page ?? 1);
  const offset = (page - 1) * PER_PAGE;

  let query = supabase
    .from("mimosa_spots")
    .select("*", { count: "exact" });

  query = query.eq("state", state).ilike("city", city);

  if (neighborhood) {
    const nh = neighborhood.replace(/-/g, " ");
    query = query.ilike("neighborhood", nh);
  }

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,deal_terms.ilike.%${filters.search}%`
    );
  }

  if (filters.priceBucket) {
    if (filters.priceBucket === "15-20") query = query.gte("mimosa_price", 15).lte("mimosa_price", 20);
    else if (filters.priceBucket === "21-25") query = query.gte("mimosa_price", 21).lte("mimosa_price", 25);
    else if (filters.priceBucket === "26-35") query = query.gte("mimosa_price", 26).lte("mimosa_price", 35);
    else if (filters.priceBucket === "36+") query = query.gte("mimosa_price", 36);
    else if (filters.priceBucket === "unknown") query = query.is("mimosa_price", null);
  }

  if (filters.showPending !== true) {
    query = query.eq("is_published", true);
  }

  const featuredQuery = supabase
    .from("mimosa_spots")
    .select("*")
    .eq("state", state)
    .ilike("city", city)
    .eq("featured", true)
    .eq("is_published", true)
    .order("featured_activated_at", { ascending: true, nullsFirst: false })
    .limit(3);

  if (neighborhood) {
    const nh = neighborhood.replace(/-/g, " ");
    featuredQuery.ilike("neighborhood", nh);
  }

  const [featuredRes, listRes] = await Promise.all([
    featuredQuery,
    query
      .order("featured", { ascending: false })
      .order("confirmation_score", { ascending: false })
      .order("mimosa_price", { ascending: true, nullsFirst: true })
      .order("name")
      .range(offset, offset + PER_PAGE - 1),
  ]);

  const featured = (featuredRes.data ?? []) as MimosaSpot[];
  const spots = (listRes.data ?? []) as MimosaSpot[];
  const total = listRes.count ?? 0;

  return { spots, total, featured };
}

export async function getSpotById(id: string): Promise<MimosaSpot | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("mimosa_spots").select("*").eq("id", id).single();
  return data as MimosaSpot | null;
}

export async function getSpotBySlug(stateCode: string, citySlug: string, venueSlugId: string): Promise<MimosaSpot | null> {
  const id = venueSlugId.split("-").pop() ?? "";
  return getSpotById(id);
}

export async function getStateFeatured(stateCode: string, limit = 3): Promise<MimosaSpot[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("mimosa_spots")
    .select("*")
    .eq("state", stateCode.toUpperCase())
    .eq("featured", true)
    .eq("is_published", true)
    .order("featured_activated_at", { ascending: true })
    .limit(limit);
  return (data ?? []) as MimosaSpot[];
}

export async function getCitiesWithSpots(stateCode: string): Promise<{ city: string; count: number }[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("mimosa_spots")
    .select("city")
    .eq("state", stateCode.toUpperCase())
    .eq("is_published", true);
  const byCity = new Map<string, number>();
  for (const row of data ?? []) {
    const c = (row as { city: string }).city;
    byCity.set(c, (byCity.get(c) ?? 0) + 1);
  }
  return Array.from(byCity.entries()).map(([city, count]) => ({ city, count }));
}

export async function getNeighborhoodsByCity(stateCode: string, cityName: string): Promise<{ slug: string; name: string }[]> {
  const supabase = createAdminClient();
  const city = cityName.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const { data } = await supabase
    .from("mimosa_spots")
    .select("neighborhood")
    .eq("state", stateCode.toUpperCase())
    .ilike("city", city)
    .eq("is_published", true)
    .not("neighborhood", "is", null);
  const set = new Set((data ?? []).map((r) => (r as { neighborhood: string }).neighborhood).filter(Boolean));
  return Array.from(set)
    .sort()
    .map((name) => ({ name, slug: slugify(name) }));
}
