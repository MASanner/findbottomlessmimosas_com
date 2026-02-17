import { Nav } from "@/components/nav";

export default function OwnerVenuesPage() {
  return (
    <>
      <Nav host="my" />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">My Venues</h1>
        <p className="text-muted-foreground mb-4">Table: venue name, status, featured, views/calls, trial days, Edit/Billing. Wired to Supabase.</p>
      </main>
    </>
  );
}
