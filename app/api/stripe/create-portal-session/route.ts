import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const returnUrl = (body.return_url as string) || `${new URL(request.url).origin}/venues`;

  const { data: spot } = await supabase
    .from("mimosa_spots")
    .select("stripe_customer_id")
    .eq("claimed_by", user.id)
    .not("stripe_customer_id", "is", null)
    .limit(1)
    .single();

  const customerId = spot?.stripe_customer_id as string | undefined;
  if (!customerId) {
    return NextResponse.json({ error: "No billing customer found" }, { status: 400 });
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: session.url });
}
