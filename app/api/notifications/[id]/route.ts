import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";

export const runtime = "nodejs";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const currentUser = await requireAppUser();
    await connectToDatabase();

    const notification = await Notification.findById(id);
    if (!notification) {
      return NextResponse.json({ message: "Notification not found" }, { status: 404 });
    }

    if (String(notification.userId) !== currentUser.id && currentUser.role === "member") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    notification.readAt = new Date();
    await notification.save();

    return NextResponse.json({
      notification: {
        id: String(notification._id),
        readAt: notification.readAt?.toISOString?.() ?? null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500 });
  }
}
