import { createServerClient as createSSRServerClient, createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * サーバー用 Supabase クライアント
 * Server Components / Server Actions / Route Handlers で使用
 */
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component からの呼び出し時は set できないが問題なし
          }
        },
      },
    }
  );
}

/**
 * ブラウザ用 Supabase クライアント
 * Client Components で使用
 */
export function createBrowserClient(): SupabaseClient {
  return createSSRBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
