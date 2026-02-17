import Link from "next/link";
import { Nav } from "@/components/nav";

export default function AdminScrapePage() {
  return (
    <>
      <Nav host="www" />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">Scrape</h1>
        <Link href="/admin" className="text-muted-foreground underline">← Admin</Link>
        <p className="mt-4 text-muted-foreground">Manual scrape trigger and last run stats will be wired here.</p>
      </main>
    </>
  );
}
