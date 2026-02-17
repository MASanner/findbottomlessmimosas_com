import { createClient } from "@supabase/supabase-js";

/** Server-only. Use for cron, webhooks, and server actions that need to bypass RLS. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceRoleKey);
}
