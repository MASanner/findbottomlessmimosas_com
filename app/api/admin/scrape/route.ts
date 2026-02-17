import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Admin-only: trigger scrape (same as cron but requires auth + app_role=admin). */
export async function POST(request: Request) {
  const supabase = createClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = user.app_metadata?.app_role as string | undefined;
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base = new URL(request.url).origin;
  const secret = process.env.CRON_SECRET;
  const res = await fetch(`${base}/api/scrape-mimosas`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-cron-secret": secret ?? "" },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
