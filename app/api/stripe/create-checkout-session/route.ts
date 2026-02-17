import { NextResponse } from "next/server";
import { getStripe, TRIAL_DAYS } from "@/lib/stripe/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { spot_id: spotId, price_id: priceId } = body as { spot_id?: string; price_id?: string };
  if (!spotId) {
    return NextResponse.json({ error: "spot_id required" }, { status: 400 });
  }

  const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY;
  const annualPriceId = process.env.STRIPE_PRICE_ID_ANNUAL;
  const chosenPriceId = priceId === annualPriceId ? annualPriceId : monthlyPriceId;
  if (!chosenPriceId) {
    return NextResponse.json({ error: "Stripe price not configured" }, { status: 500 });
  }

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    line_items: [{ price: chosenPriceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: { spot_id: spotId, user_id: user.id },
    },
    metadata: { spot_id: spotId, user_id: user.id },
    success_url: `${new URL(request.url).origin}/venues?success=1`,
    cancel_url: `${new URL(request.url).origin}/venues`,
  });

  return NextResponse.json({ url: session.url });
}
