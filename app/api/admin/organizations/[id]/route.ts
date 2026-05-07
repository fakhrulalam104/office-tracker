import { NextResponse } from "next/server";
import { requireManager } from "@/lib/admin";
import { logAuditEvent } from "@/lib/audit";
import { connectToDatabase } from "@/lib/mongodb";
import { Organization } from "@/models/Organization";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requireManager();
    const body = await request.json();

    await connectToDatabase();
    const organization = await Organization.findById(params.id);
    if (!organization) {
      return NextResponse.json({ message: "Organization not found" }, { status: 404 });
    }

    if (currentUser.role !== "super_admin" && String(organization._id) !== String(currentUser.organizationId ?? "")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (typeof body?.name === "string" && body.name.trim()) {
      organization.name = body.name.trim();
    }
    if (body?.plan === "trial" || body?.plan === "starter" || body?.plan === "team" || body?.plan === "enterprise") {
      organization.plan = body.plan;
    }

    await organization.save();

    await logAuditEvent({
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      action: "organization.updated",
      entityType: "organization",
      entityId: String(organization._id),
      details: { name: organization.name, plan: organization.plan }
    });

    return NextResponse.json({
      organization: {
        id: String(organization._id),
        name: organization.name,
        ownerId: organization.ownerId ? String(organization.ownerId) : null,
        plan: organization.plan
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500 });
  }
}
