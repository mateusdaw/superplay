import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const AUTH_ROUTES = new Set(["/login", "/forgot-password", "/reset-password"]);

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!isSupabaseConfigured() || isAuthRoute(pathname) || isPublicAsset(pathname)) {
    return response;
  }

  if (!hasSupabaseAuthCookie(request) && !hasSupabaseAuthCookie(response)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.has(pathname);
}

function isPublicAsset(pathname: string): boolean {
  return pathname.startsWith("/_next/") || pathname.includes(".");
}

function hasSupabaseAuthCookie(
  source: NextRequest | NextResponse
): boolean {
  return source.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")
    );
}
