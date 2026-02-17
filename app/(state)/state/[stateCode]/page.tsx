import Link from "next/link";
import { Nav } from "@/components/nav";

type Props = { params: Promise<{ stateCode: string }> };

export const revalidate = 3600;

export default async function StateLandingPage({ params }: Props) {
  const { stateCode } = await params;
  const stateUpper = stateCode.toUpperCase();
  // TODO: fetch featured venues (top 3 state-wide) and city list from Supabase
  return (
    <>
      <Nav host="state" stateCode={stateCode} />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">Bottomless Mimosas in {stateUpper}</h1>
        <p className="text-muted-foreground mb-6">Featured spots and cities (wired to Supabase).</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><Link href="/tampa" className="text-primary underline">Tampa</Link></li>
          <li><Link href="/orlando" className="text-primary underline">Orlando</Link></li>
          <li><Link href="/miami" className="text-primary underline">Miami</Link></li>
          <li><Link href="/st-petersburg" className="text-primary underline">St. Petersburg</Link></li>
        </ul>
      </main>
    </>
  );
}
