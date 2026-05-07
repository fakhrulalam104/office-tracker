import { NextRequest, NextResponse } from "next/server";
import { requireAppUser, requireReviewer, buildScopeQuery } from "@/lib/admin";
import { logAuditEvent } from "@/lib/audit";
import { connectToDatabase } from "@/lib/mongodb";
import { ApprovalRequest } from "@/models/ApprovalRequest";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAppUser();
    await connectToDatabase();

    const status = request.nextUrl.searchParams.get("status");
    const scope = currentUser.role === "member" ? { userId: currentUser.id } : buildScopeQuery(currentUser);
    const query = {
      ...scope,
      ...(status ? { status } : {})
    };

    const approvals = await ApprovalRequest.find(query).sort({ createdAt: -1 }).lean();
    const users = await User.find({ _id: { $in: approvals.map((approval) => approval.userId) } }).select("name email").lean();
    const userMap = new Map(users.map((user) => [String(user._id), user]));

    return NextResponse.json({
      approvals: approvals.map((approval) => ({
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
        userName: userMap.get(String(approval.userId))?.name ?? null,
        userEmail: userMap.get(String(approval.userId))?.email ?? null
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireAppUser();
    const body = await request.json();
    await connectToDatabase();

    const type = body?.type === "leave" || body?.type === "expense" || body?.type === "correction" ? body.type : "correction";
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const date = typeof body?.date === "string" ? body.date : "";
    const amount = Number.isFinite(Number(body?.amount)) ? Number(body.amount) : 0;
    const note = typeof body?.note === "string" ? body.note.trim() : "";

    if (!title || !date) {
      return NextResponse.json({ message: "Title and date are required" }, { status: 400 });
    }

    const approval = await ApprovalRequest.create({
      userId: currentUser.id,
      organizationId: currentUser.organizationId || undefined,
      type,
      date,
      title,
      amount,
      note
    });

    await logAuditEvent({
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      action: "approval.created",
      entityType: "approval",
      entityId: String(approval._id),
      details: { type, date, title, amount }
    });

    return NextResponse.json({
      approval: {
        id: String(approval._id),
        userId: String(approval.userId),
        organizationId: approval.organizationId ? String(approval.organizationId) : null,
        type: approval.type,
        date: approval.date,
        title: approval.title,
        amount: approval.amount ?? 0,
        note: approval.note ?? "",
        status: approval.status,
        createdAt: approval.createdAt?.toISOString?.() ?? null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
