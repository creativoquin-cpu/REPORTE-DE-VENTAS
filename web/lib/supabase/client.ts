import { createBrowserClient } from "@supabase/ssr";

/** Cliente de Supabase para Client Components (mismo rol que `sb` en quin-admin.html). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
