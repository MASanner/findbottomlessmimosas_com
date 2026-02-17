import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const spotId = session.metadata?.spot_id ?? null;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      if (!spotId || !subscriptionId) break;

      const sub = await getStripe().subscriptions.retrieve(subscriptionId);
      const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;

      await supabase
        .from("mimosa_spots")
        .update({
          claimed_by: session.metadata?.user_id ?? null,
          stripe_customer_id: customerId ?? null,
          stripe_subscription_id: subscriptionId,
          subscription_status: sub.status,
          trial_ends: trialEnd,
          featured: true,
          featured_activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", spotId);
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const { data: row } = await supabase
        .from("mimosa_spots")
        .select("id")
        .eq("stripe_subscription_id", sub.id)
        .single();
      if (!row) break;

      const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
      const updates: Record<string, unknown> = {
        subscription_status: sub.status,
        trial_ends: trialEnd,
        updated_at: new Date().toISOString(),
      };
      if (sub.status === "canceled" || sub.status === "unpaid" || sub.status === "past_due") {
        updates.featured = false;
      }
      await supabase.from("mimosa_spots").update(updates).eq("id", row.id);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
      if (!subId) break;
      const { data: row } = await supabase
        .from("mimosa_spots")
        .select("id")
        .eq("stripe_subscription_id", subId)
        .single();
      if (row) {
        await supabase
          .from("mimosa_spots")
          .update({ subscription_status: "past_due", updated_at: new Date().toISOString() })
          .eq("id", row.id);
      }
      break;
    }

    case "invoice.paid":
      // Optional: ensure featured stays true on successful payment
      break;

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
