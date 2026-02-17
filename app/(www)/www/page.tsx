import Link from "next/link";
import { Nav } from "@/components/nav";
import { getOwnerPortalUrl, getStateUrl } from "@/lib/site-url";

export default function NationalHubPage() {
  return (
    <>
      <Nav host="www" />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">Find Bottomless Mimosas</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Discover bottomless mimosas and brunch drink specials near you.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/near-me"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90"
          >
            Near me
          </Link>
          <a
            href={getStateUrl("fl")}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 font-medium hover:bg-accent"
          >
            Florida
          </a>
          <a
            href={getOwnerPortalUrl()}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 font-medium hover:bg-accent"
          >
            Claim your spot
          </a>
        </div>
        <footer className="mt-16 border-t pt-8 text-sm text-muted-foreground">
          <p className="mb-2">
            🍹 Deals change hourly. Prices/availability shown from public sources. CALL TO CONFIRM before heading out. We&apos;re a directory, not your reservation desk.
          </p>
          <nav className="flex gap-4">
            <Link href="/privacy" className="underline">Privacy</Link>
            <Link href="/terms" className="underline">Terms</Link>
            <Link href="/contact" className="underline">Contact</Link>
          </nav>
        </footer>
      </main>
    </>
  );
}
