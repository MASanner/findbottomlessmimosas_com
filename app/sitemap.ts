import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

const BASE = "https://findbottomlessmimosas.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/near-me`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  const states = ["fl"];
  const citiesByState: Record<string, string[]> = {
    fl: ["tampa", "orlando", "miami", "st-petersburg"],
  };

  for (const stateCode of states) {
    const stateHost = `https://${stateCode}.findbottomlessmimosas.com`;
    entries.push({
      url: stateHost,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    });
    const cities = citiesByState[stateCode] ?? [];
    for (const citySlug of cities) {
      entries.push({
        url: `${stateHost}/${citySlug}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  }

  try {
    const supabase = createAdminClient();
    const { data: spots } = await supabase
      .from("mimosa_spots")
      .select("id, name, city, state")
      .eq("is_published", true);

    if (spots?.length) {
      const byState = new Map<string, typeof spots>();
      for (const s of spots) {
        const key = (s.state ?? "").toLowerCase();
        if (!byState.has(key)) byState.set(key, []);
        byState.get(key)!.push(s);
      }
      for (const [stateCode, list] of byState) {
        const stateHost = `https://${stateCode}.findbottomlessmimosas.com`;
        for (const s of list) {
          const citySlug = slugify(s.city ?? "");
          const venueSlug = `${slugify(s.name ?? "")}-${s.id}`;
          entries.push({
            url: `${stateHost}/${citySlug}/${venueSlug}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
    }
  } catch {
    // no Supabase or empty
  }

  return entries;
}
