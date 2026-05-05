import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAuthSecret, getAuthSecretSource } from "@/lib/auth-env";
import { authDebug, authDebugError } from "@/lib/auth-debug";

const protectedRoutes = ["/dashboard"];
const protectedApiPrefixes = ["/api/entries", "/api/summary"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isProtectedApi = protectedApiPrefixes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  authDebug("middleware.check-start", {
    pathname,
    isProtectedRoute,
    isProtectedApi,
    host: request.headers.get("host"),
    authSecretSource: getAuthSecretSource()
  });

  if (!isProtectedRoute && !isProtectedApi) {
    authDebug("middleware.public-route", { pathname });
    return NextResponse.next();
  }

  let token: Awaited<ReturnType<typeof getToken>>;
  try {
    token = await getToken({ req: request, secret: getAuthSecret() });
    authDebug("middleware.token-result", {
      pathname,
      hasToken: Boolean(token),
      userId: token?.userId ?? null,
      email: token?.email ?? null
    });
  } catch (error) {
    authDebugError("middleware.token-error", error, { pathname });
    throw error;
  }

  if (token) {
    authDebug("middleware.authorized", {
      pathname,
      userId: token.userId ?? null
    });
    return NextResponse.next();
  }

  if (isProtectedApi) {
    authDebug("middleware.api-unauthorized", { pathname });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  authDebug("middleware.page-redirect-login", { pathname });
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/entries", "/api/entries/:path*", "/api/summary"]
};
