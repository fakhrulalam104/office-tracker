import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { canManageTeam } from "@/lib/roles";
import { User } from "@/models/User";
import { WorkspaceItem } from "@/models/WorkspaceItem";

export const runtime = "nodejs";

function normalizeString(value: unknown, fallback = "", max = 1000) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback;
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string" || !value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean))).slice(0, 10);
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

function canModify(currentUser: Awaited<ReturnType<typeof requireAppUser>>, item: any) {
  if (item.type === "announcement") {
    return currentUser.role === "super_admin" || currentUser.role === "hr";
  }

  if (item.type === "task" && currentUser.role === "coordinator") {
    return true;
  }

  return canManageTeam(currentUser.role) || String(item.createdBy) === currentUser.id;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requireAppUser();
    const body = await request.json().catch(() => ({}));
    await connectToDatabase();

    const item = await WorkspaceItem.findById(params.id);
    if (!item) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    const isAssignedMemberTaskUpdate = item.type === "task" && currentUser.role === "member" && String(item.assigneeId ?? "") === currentUser.id;
    if (isAssignedMemberTaskUpdate) {
      const requestedKeys = Object.keys(body ?? {});
      const allowedKeys = new Set(["status", "metadata"]);
      if (requestedKeys.some((key) => !allowedKeys.has(key))) {
        return NextResponse.json({ message: "Members cannot edit task details" }, { status: 403 });
      }

      const nextStatus = "status" in body ? normalizeString(body.status, item.status, 40) : item.status;
      if (!["in_progress", "review"].includes(nextStatus)) {
        return NextResponse.json({ message: "Members can only start, stop, or submit assigned tasks" }, { status: 403 });
      }

      item.status = nextStatus;
      if ("metadata" in body) {
        const metadata = body.metadata && typeof body.metadata === "object" ? (body.metadata as Record<string, unknown>) : {};
        const existingMetadata = item.metadata && typeof item.metadata === "object" ? (item.metadata as Record<string, unknown>) : {};
        const comments = Array.isArray(metadata.comments) ? metadata.comments : Array.isArray(existingMetadata.comments) ? existingMetadata.comments : [];
        item.metadata = {
          ...existingMetadata,
          timeSpentSeconds: Number.isFinite(Number(metadata.timeSpentSeconds)) ? Number(metadata.timeSpentSeconds) : (item.metadata as any)?.timeSpentSeconds ?? 0,
          ...(typeof metadata.submittedAt === "string" ? { submittedAt: metadata.submittedAt } : {}),
          comments
        };
      }

      await item.save();
      return NextResponse.json({ item: toItemResponse(item) });
    }

    if (!canModify(currentUser, item)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if ("title" in body) item.title = normalizeString(body.title, item.title, 180);
    if ("description" in body) item.description = normalizeString(body.description, "", 12000);
    if ("status" in body) item.status = normalizeString(body.status, item.status, 40);
    if ("priority" in body) item.priority = normalizeString(body.priority, item.priority, 40);
    if ("assigneeId" in body) {
      const assigneeId = normalizeString(body.assigneeId, "", 80);

      if (item.type === "task" && assigneeId) {
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

      item.assigneeId = assigneeId || undefined;
    }
    if ("startDate" in body) item.startDate = normalizeDate(body.startDate);
    if ("dueDate" in body) item.dueDate = normalizeDate(body.dueDate);
    if ("amount" in body) item.amount = Number.isFinite(Number(body.amount)) ? Number(body.amount) : 0;
    if ("tags" in body) item.tags = normalizeTags(body.tags);
    if ("metadata" in body) {
      item.metadata =
        body.metadata && typeof body.metadata === "object"
          ? { ...(item.metadata && typeof item.metadata === "object" ? item.metadata : {}), ...body.metadata }
          : item.metadata;
    }

    await item.save();
    return NextResponse.json({ item: toItemResponse(item) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requireAppUser();
    await connectToDatabase();

    const item = await WorkspaceItem.findById(params.id);
    if (!item) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    if (!canModify(currentUser, item)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await item.deleteOne();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
