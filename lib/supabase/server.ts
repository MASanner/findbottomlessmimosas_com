import { createServerClient } from "@supabase/ssr";

export function createClient(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.headers.get("cookie")?.split(";").map((c) => {
          const [name, ...v] = c.trim().split("=");
          return { name, value: v.join("=").trim() };
        }) ?? [];
      },
      setAll(_cookiesToSet: { name: string; value: string }[]) {
        // Handled by NextResponse in middleware or route handlers
      },
    },
  });
}
