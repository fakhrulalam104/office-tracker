import { NextRequest, NextResponse } from "next/server";
import { requireManager, buildScopeQuery } from "@/lib/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { AuditLog } from "@/models/AuditLog";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireManager();
    await connectToDatabase();

    const limit = Math.min(100, Math.max(10, Number(request.nextUrl.searchParams.get("limit") ?? 40)));
    const logs = await AuditLog.find(buildScopeQuery(currentUser)).sort({ createdAt: -1 }).limit(limit).lean();
    const users = await User.find({ _id: { $in: logs.map((log) => log.userId) } }).select("name email").lean();
    const userMap = new Map(users.map((user) => [String(user._id), user]));

    return NextResponse.json({
      audit: logs.map((log) => ({
        id: String(log._id),
        userId: String(log.userId),
        organizationId: log.organizationId ? String(log.organizationId) : null,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId ?? "",
        details: log.details ?? {},
        createdAt: log.createdAt?.toISOString?.() ?? null,
        userName: userMap.get(String(log.userId))?.name ?? null,
        userEmail: userMap.get(String(log.userId))?.email ?? null
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500 });
  }
}
