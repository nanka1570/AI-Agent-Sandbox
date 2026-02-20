import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * 認証ミドルウェア
 * - セッションの更新（Cookie のリフレッシュ）
 * - 未認証ユーザーを /login にリダイレクト
 * - 認証ページ（/login, /register, /forgot-password）はスキップ
 */
export async function middleware(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // セッションをリフレッシュ（重要: getUser を使う）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 認証不要ページ（未認証でもアクセス可能）
  const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/auth/callback", "/offline", "/privacy", "/terms"];
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // 認証ページ（認証済みならダッシュボードにリダイレクト）
  const authPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // 未認証で保護ページにアクセスした場合、ログインにリダイレクト
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 認証済みで認証ページにアクセスした場合、ダッシュボードにリダイレクト
  if (user && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
