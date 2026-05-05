import { handlers } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

function bindAuthUrlToRequest(request: NextRequest) {
  const origin = new URL(request.url).origin;
  process.env.AUTH_URL = origin;
  process.env.NEXTAUTH_URL = origin;
}

export async function GET(request: NextRequest) {
  bindAuthUrlToRequest(request);
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  bindAuthUrlToRequest(request);
  return handlers.POST(request);
}
