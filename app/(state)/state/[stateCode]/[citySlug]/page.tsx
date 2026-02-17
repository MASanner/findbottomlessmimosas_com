import Link from "next/link";
import { Nav } from "@/components/nav";
import { ListingCard } from "@/components/listing-card";
import { CityMap } from "@/components/city-map";
import { CityFilters } from "@/components/city-filters";
import { getSpotsByCity, getNeighborhoodsByCity } from "@/lib/supabase/queries";
import { slugify } from "@/lib/utils";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ stateCode: string; citySlug: string }>;
  searchParams: Promise<{ page?: string; search?: string; price?: string; neighborhood?: string; showPending?: string }>;
};

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateCode, citySlug } = await params;
  const cityName = citySlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const stateUpper = stateCode.toUpperCase();
  return {
    title: `Bottomless Mimosas in ${cityName}, ${stateUpper} (Confirmed Spots)`,
    description: `Find bottomless mimosas in ${cityName}, ${stateUpper}. Deals change hourly — call to confirm before heading out.`,
  };
}

export default async function CityPage({ params, searchParams }: Props) {
  const { stateCode, citySlug } = await params;
  const sp = await searchParams;
  const cityName = citySlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const stateUpper = stateCode.toUpperCase();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const filters = {
    page,
    search: sp.search ?? undefined,
    priceBucket: sp.price ?? undefined,
    neighborhood: sp.neighborhood ?? undefined,
    showPending: sp.showPending === "1",
  };

  const [result, neighborhoods] = await Promise.all([
    getSpotsByCity(stateCode, citySlug, filters),
    getNeighborhoodsByCity(stateCode, cityName),
  ]);

  const { spots, total, featured } = result;
  const featuredIds = new Set(featured.map((s) => s.id));
  const totalPages = Math.ceil(total / 20);
  const hasFilters = !!(sp.search || sp.price || sp.neighborhood || sp.showPending);

  return (
    <>
      <Nav host="state" stateCode={stateCode} />
      <main className="container mx-auto px-4 py-8">
        <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/30 p-4 mb-6 text-center text-sm">
          🍹 Deals change hourly. Prices/availability shown from public sources. CALL TO CONFIRM before heading out. We&apos;re a directory, not your reservation desk.
        </div>
        <h1 className="text-4xl font-bold mb-4">Bottomless Mimosas in {cityName}, {stateUpper}</h1>

        <div className="flex gap-6 flex-col lg:flex-row">
          <CityFilters neighborhoods={neighborhoods} />
          <div className="flex-1 min-w-0">
            <div className="mb-6 h-[400px] rounded-lg overflow-hidden">
              <CityMap spots={spots} featuredIds={featuredIds} />
            </div>
            {featured.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Featured</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {featured.map((spot) => (
                    <ListingCard key={spot.id} spot={spot} stateCode={stateCode} citySlug={citySlug} />
                  ))}
                </div>
              </section>
            )}
            <section>
              <h2 className="text-xl font-semibold mb-4">All spots</h2>
              <div className="grid gap-4 sm:grid-cols-1">
                {spots.map((spot) => (
                  <ListingCard key={spot.id} spot={spot} stateCode={stateCode} citySlug={citySlug} />
                ))}
              </div>
              {spots.length === 0 && (
                <p className="text-muted-foreground">No spots found. Check filters or try another city.</p>
              )}
            </section>
            {totalPages > 1 && (
              <nav className="mt-6 flex items-center gap-2" aria-label="Pagination">
                {page > 1 && (
                  <Link
                    href={page === 2 ? (() => { const u = new URLSearchParams(sp as Record<string, string>); u.delete("page"); const q = u.toString(); return q ? `?${q}` : "?"; })() : `?${new URLSearchParams({ ...sp, page: String(page - 1) } as Record<string, string>)}`}
                    className="text-primary underline"
                    rel="prev"
                  >
                    Previous
                  </Link>
                )}
                <span className="text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`?${new URLSearchParams({ ...sp, page: String(page + 1) } as Record<string, string>)}`}
                    className="text-primary underline"
                    rel="next"
                  >
                    Next
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
