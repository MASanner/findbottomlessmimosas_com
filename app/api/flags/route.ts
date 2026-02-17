import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_REASONS = ["wrong price", "closed", "no mimosas", "other"] as const;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const spotId = body.spot_id as string | undefined;
  const reason = body.reason as string | undefined;
  const details = body.details as string | undefined;
  const reporterEmail = body.reporter_email as string | undefined;

  if (!spotId || !reason || !ALLOWED_REASONS.includes(reason as (typeof ALLOWED_REASONS)[number])) {
    return NextResponse.json(
      { error: "spot_id and reason (wrong price | closed | no mimosas | other) required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("flags").insert({
    spot_id: spotId,
    reason,
    details: details ?? null,
    reporter_email: reporterEmail ?? null,
    status: "open",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
