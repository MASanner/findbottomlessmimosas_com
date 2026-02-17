import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const spotId = body.spot_id as string | undefined;
  if (!spotId) {
    return NextResponse.json({ error: "spot_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  await supabase.rpc("increment_outbound", { p_spot_id: spotId });
  return NextResponse.json({ ok: true });
}
