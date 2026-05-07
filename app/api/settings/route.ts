import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserSettings, upsertUserSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const settings = await getUserSettings(userId);
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to load settings", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const settings = await upsertUserSettings(userId, body);
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to save settings", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
