import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { canManageTeam, normalizeUserRole } from "@/lib/roles";
import { Note } from "@/models/Note";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import { WorkspaceItem } from "@/models/WorkspaceItem";

export const runtime = "nodejs";

type SearchResult = {
  id: string;
  type: string;
  title: string;
  description: string;
  href: string;
  meta: string;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scopeForOrganization(currentUser: Awaited<ReturnType<typeof requireAppUser>>) {
  return currentUser.role === "super_admin" ? {} : { organizationId: currentUser.organizationId };
}

export async function GET(request: Request) {
  try {
    const currentUser = await requireAppUser();
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") ?? "").trim().slice(0, 80);

    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    await connectToDatabase();
    const regex = new RegExp(escapeRegex(query), "i");
    const organizationScope = scopeForOrganization(currentUser);
    const canSeeTeam = canManageTeam(currentUser.role) || currentUser.role === "coordinator";

    const [users, workspaceItems, notes, notifications] = await Promise.all([
      User.find({
        ...organizationScope,
        active: { $ne: false },
        $or: [{ name: regex }, { email: regex }, { role: regex }, { designation: regex }, { department: regex }, { jobTitle: regex }]
      })
        .select("name email role designation department jobTitle")
        .limit(8)
        .lean(),
      WorkspaceItem.find({
        ...organizationScope,
        ...(canSeeTeam ? {} : { $or: [{ createdBy: currentUser.id }, { assigneeId: currentUser.id }] }),
        $or: [{ title: regex }, { description: regex }, { status: regex }, { priority: regex }, { tags: regex }]
      })
        .select("type title description status priority")
        .sort({ updatedAt: -1 })
        .limit(18)
        .lean(),
      Note.find({ userId: currentUser.id, $or: [{ title: regex }, { body: regex }, { tags: regex }] })
        .select("title body tags")
        .sort({ updatedAt: -1 })
        .limit(8)
        .lean(),
      Notification.find({
        ...(currentUser.role === "member" ? { userId: currentUser.id } : organizationScope),
        $or: [{ title: regex }, { message: regex }]
      })
        .select("title message readAt")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean()
    ]);

    const hiddenWorkspaceTypes = new Set(["task", "project", "ticket"]);
    const itemHref: Record<string, string> = {
      leave: "/leave",
      announcement: "/announcements",
      asset: "/assets",
      document: "/documents",
      calendar: "/company-calendar"
    };

    const results: SearchResult[] = [
      ...users.map((user) => ({
        id: `user-${String(user._id)}`,
        type: "Person",
        title: user.name ?? "Team member",
        description: [user.email, user.jobTitle || user.designation, user.department].filter(Boolean).join(" | "),
        href: "/directory",
        meta: normalizeUserRole(user.role, user.email).replace("_", " ")
      })),
      ...workspaceItems
        .filter((item) => !hiddenWorkspaceTypes.has(String(item.type)))
        .map((item) => ({
          id: `workspace-${String(item._id)}`,
          type: String(item.type).replace("_", " "),
          title: item.title ?? "Untitled",
          description: String(item.description ?? "").replace(/<[^>]*>/g, "").slice(0, 180),
          href: itemHref[String(item.type)] ?? "/dashboard",
          meta: [item.status, item.priority].filter(Boolean).join(" | ")
        })),
      ...notes.map((note) => ({
        id: `note-${String(note._id)}`,
        type: "Note",
        title: note.title ?? "Untitled note",
        description: String(note.body ?? "").slice(0, 180),
        href: "/features/notes",
        meta: Array.isArray(note.tags) ? note.tags.join(", ") : ""
      })),
      ...notifications.map((notification) => ({
        id: `notification-${String(notification._id)}`,
        type: "Notification",
        title: notification.title ?? "Notification",
        description: notification.message ?? "",
        href: "/notifications",
        meta: notification.readAt ? "Read" : "Unread"
      }))
    ].slice(0, 40);

    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
