import { NextResponse } from "next/server";
import { requireReviewer, buildScopeQuery } from "@/lib/admin";
import { logAuditEvent } from "@/lib/audit";
import { connectToDatabase } from "@/lib/mongodb";
import { ApprovalRequest } from "@/models/ApprovalRequest";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requireReviewer();
    const body = await request.json();
    await connectToDatabase();

    const approval = await ApprovalRequest.findById(params.id);
    if (!approval) {
      return NextResponse.json({ message: "Approval not found" }, { status: 404 });
    }

    const scope = buildScopeQuery(currentUser);
    if (currentUser.role !== "super_admin" && String(approval.organizationId ?? "") !== String(scope.organizationId ?? "")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (body?.status === "approved" || body?.status === "rejected" || body?.status === "pending") {
      approval.status = body.status;
    }
    if (typeof body?.reviewNote === "string") {
      approval.reviewNote = body.reviewNote.trim();
    }
    approval.reviewedBy = currentUser.id as any;
    approval.reviewedAt = new Date();
    await approval.save();

    await logAuditEvent({
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      action: "approval.reviewed",
      entityType: "approval",
      entityId: String(approval._id),
      details: { status: approval.status }
    });

    return NextResponse.json({
      approval: {
        id: String(approval._id),
        status: approval.status,
        reviewedBy: approval.reviewedBy ? String(approval.reviewedBy) : null,
        reviewedAt: approval.reviewedAt?.toISOString?.() ?? null,
        reviewNote: approval.reviewNote ?? ""
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500 });
  }
}
