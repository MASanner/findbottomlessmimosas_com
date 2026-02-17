import Link from "next/link";
import { Nav } from "@/components/nav";

type Props = { params: Promise<{ id: string }> };

export default async function OwnerVenueEditPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <Nav host="my" />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Edit venue</h1>
        <p className="text-muted-foreground mb-4">Venue id: {id}. Editable fields via RPC will be wired here.</p>
        <Link href="/venues" className="text-primary underline">← Back to Venues</Link>
      </main>
    </>
  );
}
