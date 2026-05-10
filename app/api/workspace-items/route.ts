import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { canManageTeam } from "@/lib/roles";
import { User } from "@/models/User";
import { WorkspaceItem, workspaceItemTypes } from "@/models/WorkspaceItem";

export const runtime = "nodejs";

type WorkspaceItemType = (typeof workspaceItemTypes)[number];

function isWorkspaceItemType(value: unknown): value is WorkspaceItemType {
  return typeof value === "string" && workspaceItemTypes.includes(value as WorkspaceItemType);
}

function normalizeString(value: unknown, fallback = "", max = 1000) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback;
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim().replace(/\s+/g, " ").slice(0, 40))
        .filter(Boolean)
    )
  ).slice(0, 10);
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string" || !value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function canReadTeamItems(type: WorkspaceItemType, role: string) {
  return canManageTeam(role as any) || (role === "coordinator" && type === "task") || type === "announcement" || type === "calendar" || type === "project";
}

function canManageAnnouncements(role: string) {
  return role === "super_admin" || role === "hr";
}

function isManagerRole(role: unknown) {
  return role === "manager" || role === "admin" || role === "owner" || role === "super_admin";
}

function buildQuery(currentUser: Awaited<ReturnType<typeof requireAppUser>>, type: WorkspaceItemType) {
  const organizationScope = currentUser.role === "super_admin" ? {} : { organizationId: currentUser.organizationId };

  if (canReadTeamItems(type, currentUser.role)) {
    return { ...organizationScope, type };
  }

  return {
    ...organizationScope,
    type,
    $or: [{ createdBy: currentUser.id }, { assigneeId: currentUser.id }]
  };
}

function toItemResponse(item: any) {
  return {
    id: String(item._id),
    type: item.type,
    title: item.title ?? "Untitled",
    description: item.description ?? "",
    status: item.status ?? "open",
    priority: item.priority ?? "normal",
    startDate: item.startDate?.toISOString?.().slice(0, 10) ?? "",
    dueDate: item.dueDate?.toISOString?.().slice(0, 10) ?? "",
    amount: typeof item.amount === "number" ? item.amount : 0,
    tags: Array.isArray(item.tags) ? item.tags : [],
    metadata: item.metadata && typeof item.metadata === "object" ? item.metadata : {},
    createdBy: item.createdBy ? String(item.createdBy) : "",
    assigneeId: item.assigneeId ? String(item.assigneeId) : "",
    createdAt: item.createdAt?.toISOString?.() ?? "",
    updatedAt: item.updatedAt?.toISOString?.() ?? ""
  };
}

export async function GET(request: Request) {
  try {
    const currentUser = await requireAppUser();
    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    if (!isWorkspaceItemType(type)) {
      return NextResponse.json({ message: "Invalid workspace item type" }, { status: 400 });
    }

    await connectToDatabase();
    const items = await WorkspaceItem.find(buildQuery(currentUser, type)).sort({ updatedAt: -1 }).limit(300).lean();
    return NextResponse.json({ items: items.map((item) => toItemResponse(item)) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireAppUser();
    const body = await request.json().catch(() => ({}));
    const type = body?.type;

    if (!isWorkspaceItemType(type)) {
      return NextResponse.json({ message: "Invalid workspace item type" }, { status: 400 });
    }

    if (type === "announcement" && !canManageAnnouncements(currentUser.role)) {
      return NextResponse.json({ message: "Only HR or the super admin can create announcements" }, { status: 403 });
    }

    if (type === "project" && currentUser.role !== "coordinator") {
      return NextResponse.json({ message: "Only coordinators can create projects" }, { status: 403 });
    }

    const title = normalizeString(body?.title, "", 180);
    if (!title) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }

    await connectToDatabase();
    const assigneeId = normalizeString(body?.assigneeId, "", 80);
    if (type === "task" && assigneeId) {
      const assignee = (await User.findOne({
        _id: assigneeId,
        ...(currentUser.role === "super_admin" ? {} : { organizationId: currentUser.organizationId }),
        active: { $ne: false }
      }).select("role").lean()) as { role?: string } | null;

      if (!assignee) {
        return NextResponse.json({ message: "Assignee not found" }, { status: 404 });
      }

      if (currentUser.role === "coordinator" && assignee.role !== "member") {
        return NextResponse.json({ message: "Coordinators can assign tasks to members only" }, { status: 403 });
      }

      if (!canManageTeam(currentUser.role) && currentUser.role !== "coordinator" && assigneeId !== currentUser.id) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    }

    const requestMetadata = body?.metadata && typeof body.metadata === "object" ? body.metadata : {};
    const managerId = type === "task" ? normalizeString((requestMetadata as Record<string, unknown>).managerId, "", 80) : "";
    if (type === "task" && managerId) {
      const manager = (await User.findOne({
        _id: managerId,
        ...(currentUser.role === "super_admin" ? {} : { organizationId: currentUser.organizationId }),
        active: { $ne: false }
      }).select("role name").lean()) as { role?: string; name?: string } | null;

      if (!manager || !isManagerRole(manager.role)) {
        return NextResponse.json({ message: "Selected manager is not valid" }, { status: 400 });
      }
    }

    const metadata =
      type === "task"
        ? {
            ...requestMetadata,
            assignedBy: currentUser.name
          }
        : requestMetadata;

    const item = await WorkspaceItem.create({
      type,
      organizationId: currentUser.organizationId ?? undefined,
      createdBy: currentUser.id,
      assigneeId: assigneeId || undefined,
      title,
      description: normalizeString(body?.description, "", 12000),
      status: normalizeString(body?.status, "open", 40),
      priority: normalizeString(body?.priority, "normal", 40),
      startDate: normalizeDate(body?.startDate),
      dueDate: normalizeDate(body?.dueDate),
      amount: Number.isFinite(Number(body?.amount)) ? Number(body.amount) : 0,
      tags: normalizeTags(body?.tags),
      metadata
    });

    return NextResponse.json({ item: toItemResponse(item) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
