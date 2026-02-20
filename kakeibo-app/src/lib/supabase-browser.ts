import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";

/**
 * ブラウザ用 Supabase クライアント（Client Components 専用）
 * next/headers を使わないため Client Component から安全に import できる
 */
export function createBrowserClient(): SupabaseClient {
  return createSSRBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
