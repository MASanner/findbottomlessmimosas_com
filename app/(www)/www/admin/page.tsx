import Link from "next/link";
import { Nav } from "@/components/nav";

export default function AdminPage() {
  return (
    <>
      <Nav host="www" />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">Admin</h1>
        <nav className="flex flex-wrap gap-4">
          <Link href="/admin/pending" className="text-primary underline">Pending listings</Link>
          <Link href="/admin/flags" className="text-primary underline">Flags</Link>
          <Link href="/admin/claims" className="text-primary underline">Claims</Link>
          <Link href="/admin/scrape" className="text-primary underline">Scrape</Link>
        </nav>
      </main>
    </>
  );
}
