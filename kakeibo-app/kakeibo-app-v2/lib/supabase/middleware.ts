import { NextResponse, type NextRequest } from "next/server";
import { PUBLIC_PATHS } from "@/lib/constants";

export function updateSession(request: NextRequest) {
  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  // Supabase SSR はセッションを "sb-<ref>-auth-token" という名前の Cookie に保存する。
  // ネットワーク通信を発生させずに Cookie の有無だけでルーティング判断する。
  const hasSession = request.cookies.getAll().some(
    (cookie) =>
      cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"),
  );

  if (!hasSession && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSession && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
