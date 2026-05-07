import { NextResponse } from "next/server";
import { requireAppUser, requireManager, buildScopeQuery } from "@/lib/admin";
import { logAuditEvent } from "@/lib/audit";
import { connectToDatabase } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function GET() {
  try {
    const currentUser = await requireAppUser();
    await connectToDatabase();

    const query = currentUser.role === "member" ? { userId: currentUser.id } : buildScopeQuery(currentUser);
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50).lean();
    const users = await User.find({ _id: { $in: notifications.map((notification) => notification.userId) } }).select("name email").lean();
    const userMap = new Map(users.map((user) => [String(user._id), user]));

    return NextResponse.json({
      notifications: notifications.map((notification) => ({
        id: String(notification._id),
        userId: String(notification.userId),
        organizationId: notification.organizationId ? String(notification.organizationId) : null,
        title: notification.title,
        message: notification.message,
        readAt: notification.readAt?.toISOString?.() ?? null,
        createdAt: notification.createdAt?.toISOString?.() ?? null,
        userName: userMap.get(String(notification.userId))?.name ?? null,
        userEmail: userMap.get(String(notification.userId))?.email ?? null
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireManager();
    const body = await request.json();
    await connectToDatabase();

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const userIds = Array.isArray(body?.userIds) ? body.userIds.filter((id: unknown) => typeof id === "string") : [];

    if (!title || !message || userIds.length === 0) {
      return NextResponse.json({ message: "Title, message, and at least one user are required" }, { status: 400 });
    }

    const users = await User.find({
      _id: { $in: userIds },
      ...(currentUser.role === "super_admin" ? {} : { organizationId: currentUser.organizationId })
    }).select("_id organizationId").lean();

    const notifications = await Notification.insertMany(
      users.map((user) => ({
        userId: user._id,
        organizationId: user.organizationId ?? undefined,
        title,
        message
      }))
    );

    await logAuditEvent({
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      action: "notification.created",
      entityType: "notification",
      entityId: notifications.map((notification) => String(notification._id)).join(","),
      details: { title, userCount: notifications.length }
    });

    return NextResponse.json({ created: notifications.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500 });
  }
}
