import Link from "next/link";
import { Nav } from "@/components/nav";

export default function OwnerLoginPage() {
  return (
    <>
      <Nav host="my" />
      <main className="container mx-auto px-4 py-12 max-w-md">
        <h1 className="text-4xl font-bold mb-4">Owner login</h1>
        <p className="text-muted-foreground mb-6">Supabase Auth (email/password + Google) will be wired here.</p>
        <Link href="/venues" className="text-primary underline">Continue to Venues</Link>
      </main>
    </>
  );
}
