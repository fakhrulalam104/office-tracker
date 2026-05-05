import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAuthSecret } from "@/lib/auth-env";

const protectedRoutes = ["/dashboard"];
const protectedApiPrefixes = ["/api/entries", "/api/summary"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: getAuthSecret() });
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isProtectedApi = protectedApiPrefixes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (!isProtectedRoute && !isProtectedApi) {
    return NextResponse.next();
  }

  if (token) {
    return NextResponse.next();
  }

  if (isProtectedApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/entries", "/api/entries/:path*", "/api/summary"]
};
