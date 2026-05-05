import { handlers } from "@/lib/auth";
import { getAuthSecretSource, getAuthUrlSource } from "@/lib/auth-env";
import { authDebug, authDebugError } from "@/lib/auth-debug";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

function bindAuthUrlToRequest(request: NextRequest) {
  const origin = new URL(request.url).origin;
  process.env.AUTH_URL = origin;
  process.env.NEXTAUTH_URL = origin;

  authDebug("auth-route.bind-url", {
    method: request.method,
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    origin,
    host: request.headers.get("host"),
    forwardedHost: request.headers.get("x-forwarded-host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
    vercelId: request.headers.get("x-vercel-id"),
    authUrlSource: getAuthUrlSource(),
    authSecretSource: getAuthSecretSource()
  });
}

export async function GET(request: NextRequest) {
  try {
    authDebug("auth-route.get-start", {
      pathname: request.nextUrl.pathname,
      search: request.nextUrl.search
    });
    bindAuthUrlToRequest(request);
    const response = await handlers.GET(request);
    authDebug("auth-route.get-complete", {
      pathname: request.nextUrl.pathname,
      status: response.status,
      hasSetCookie: response.headers.has("set-cookie"),
      location: response.headers.get("location")
    });
    return response;
  } catch (error) {
    authDebugError("auth-route.get-error", error, {
      pathname: request.nextUrl.pathname,
      search: request.nextUrl.search
    });
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    authDebug("auth-route.post-start", {
      pathname: request.nextUrl.pathname,
      search: request.nextUrl.search
    });
    bindAuthUrlToRequest(request);
    const response = await handlers.POST(request);
    authDebug("auth-route.post-complete", {
      pathname: request.nextUrl.pathname,
      status: response.status,
      hasSetCookie: response.headers.has("set-cookie"),
      location: response.headers.get("location")
    });
    return response;
  } catch (error) {
    authDebugError("auth-route.post-error", error, {
      pathname: request.nextUrl.pathname,
      search: request.nextUrl.search
    });
    throw error;
  }
}
