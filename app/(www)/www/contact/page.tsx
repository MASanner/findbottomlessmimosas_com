import { Nav } from "@/components/nav";

export default function ContactPage() {
  return (
    <>
      <Nav host="www" />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">Contact</h1>
        <p className="text-muted-foreground">Contact form and info placeholder.</p>
      </main>
    </>
  );
}
