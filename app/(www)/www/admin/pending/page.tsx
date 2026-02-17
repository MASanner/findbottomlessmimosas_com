import Link from "next/link";
import { Nav } from "@/components/nav";

export default function AdminPendingPage() {
  return (
    <>
      <Nav host="www" />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">Pending listings</h1>
        <Link href="/admin" className="text-muted-foreground underline">← Admin</Link>
        <p className="mt-4 text-muted-foreground">Pending queue (approve/edit/reject) will be wired to Supabase.</p>
      </main>
    </>
  );
}
