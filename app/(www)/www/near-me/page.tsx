import { Nav } from "@/components/nav";

export default function NearMePage() {
  return (
    <>
      <Nav host="www" />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">Bottomless Mimosas Near Me</h1>
        <p className="text-muted-foreground mb-4">
          Allow location access for the best results, or choose a city below.
        </p>
        <p className="text-sm text-muted-foreground">
          (Near-me search UI and map will be wired to Supabase + GPS here.)
        </p>
      </main>
    </>
  );
}
