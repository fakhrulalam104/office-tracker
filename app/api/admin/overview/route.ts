import { NextResponse } from "next/server";
import { requireManager, buildScopeQuery } from "@/lib/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { ApprovalRequest } from "@/models/ApprovalRequest";
import { AuditLog } from "@/models/AuditLog";
import { Notification } from "@/models/Notification";
import { Organization } from "@/models/Organization";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function GET() {
  try {
    const currentUser = await requireManager();
    await connectToDatabase();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const scope = buildScopeQuery(currentUser);
    const userScope = currentUser.role === "super_admin" ? {} : { organizationId: currentUser.organizationId };

    const [users, organizations, pendingApprovals, notifications, auditLogs] = await Promise.all([
      User.find(userScope).sort({ createdAt: -1 }).lean(),
      Organization.find(currentUser.role === "super_admin" ? {} : { _id: currentUser.organizationId }).sort({ createdAt: -1 }).lean(),
      ApprovalRequest.find({ ...scope, status: "pending" }).sort({ createdAt: -1 }).limit(20).lean(),
      Notification.find(scope).sort({ createdAt: -1 }).limit(20).lean(),
      AuditLog.find(scope).sort({ createdAt: -1 }).limit(30).lean()
    ]);

    const userMap = new Map(users.map((user) => [String(user._id), user]));
    const organizationMap = new Map(organizations.map((organization) => [String(organization._id), organization]));

    return NextResponse.json({
      metrics: {
        totalUsers: users.length,
        activeUsers: users.filter((user) => user.active !== false).length,
        inactiveUsers: users.filter((user) => user.active === false).length,
        newUsers30d: users.filter((user) => user.createdAt && user.createdAt >= thirtyDaysAgo).length,
        totalOrganizations: organizations.length,
        pendingApprovals: pendingApprovals.length,
        unreadNotifications: notifications.filter((notification) => !notification.readAt).length,
        roleDistribution: ["super_admin", "owner", "admin", "manager", "hr", "member"].map((role) => ({
          role,
          count: users.filter((user) => (user.role ?? "member") === role).length
        })),
        planDistribution: ["trial", "starter", "team", "enterprise"].map((plan) => ({
          plan,
          count: organizations.filter((organization) => organization.plan === plan).length
        })),
        recentSignups: users.slice(0, 8).map((user) => ({
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role ?? "member",
          createdAt: user.createdAt?.toISOString?.() ?? null
        }))
      },
      organizations: organizations.map((organization) => {
        const owner = organization.ownerId ? userMap.get(String(organization.ownerId)) : null;
        return {
          id: String(organization._id),
          name: organization.name,
          ownerId: organization.ownerId ? String(organization.ownerId) : null,
          plan: organization.plan,
          createdAt: organization.createdAt?.toISOString?.() ?? null,
          ownerName: owner?.name ?? null,
          ownerEmail: owner?.email ?? null
        };
      }),
      users: users.map((user) => ({
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role ?? "member",
        organizationId: user.organizationId ? String(user.organizationId) : null,
        organizationName: user.organizationId ? organizationMap.get(String(user.organizationId))?.name ?? null : null,
        active: user.active !== false,
        createdAt: user.createdAt?.toISOString?.() ?? null
      })),
      approvals: pendingApprovals.map((approval) => {
        const user = userMap.get(String(approval.userId));
        return {
          id: String(approval._id),
          userId: String(approval.userId),
          organizationId: approval.organizationId ? String(approval.organizationId) : null,
          type: approval.type,
          date: approval.date,
          title: approval.title,
          amount: approval.amount ?? 0,
          note: approval.note ?? "",
          status: approval.status,
          reviewedBy: approval.reviewedBy ? String(approval.reviewedBy) : null,
          reviewedAt: approval.reviewedAt?.toISOString?.() ?? null,
          reviewNote: approval.reviewNote ?? "",
          createdAt: approval.createdAt?.toISOString?.() ?? null,
          userName: user?.name ?? null,
          userEmail: user?.email ?? null
        };
      }),
      notifications: notifications.map((notification) => {
        const user = userMap.get(String(notification.userId));
        return {
          id: String(notification._id),
          userId: String(notification.userId),
          organizationId: notification.organizationId ? String(notification.organizationId) : null,
          title: notification.title,
          message: notification.message,
          readAt: notification.readAt?.toISOString?.() ?? null,
          createdAt: notification.createdAt?.toISOString?.() ?? null,
          userName: user?.name ?? null,
          userEmail: user?.email ?? null
        };
      }),
      audit: auditLogs.map((log) => {
        const user = userMap.get(String(log.userId));
        return {
          id: String(log._id),
          userId: String(log.userId),
          organizationId: log.organizationId ? String(log.organizationId) : null,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId ?? "",
          details: log.details ?? {},
          createdAt: log.createdAt?.toISOString?.() ?? null,
          userName: user?.name ?? null,
          userEmail: user?.email ?? null
        };
      })
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500 });
  }
}
