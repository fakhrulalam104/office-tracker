import { NextResponse } from "next/server";
import { requireManager } from "@/lib/admin";
import { logAuditEvent } from "@/lib/audit";
import { connectToDatabase } from "@/lib/mongodb";
import { Organization } from "@/models/Organization";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function GET() {
  try {
    const currentUser = await requireManager();
    await connectToDatabase();

    const organizations = await Organization.find(currentUser.role === "super_admin" ? {} : { _id: currentUser.organizationId }).sort({ createdAt: -1 }).lean();
    const owners = await User.find({ _id: { $in: organizations.map((organization) => organization.ownerId).filter(Boolean) } })
      .select("name email")
      .lean();
    const ownerMap = new Map(owners.map((owner) => [String(owner._id), owner]));

    return NextResponse.json({
      organizations: organizations.map((organization) => ({
        id: String(organization._id),
        name: organization.name,
        ownerId: organization.ownerId ? String(organization.ownerId) : null,
        plan: organization.plan,
        createdAt: organization.createdAt?.toISOString?.() ?? null,
        ownerName: organization.ownerId ? ownerMap.get(String(organization.ownerId))?.name ?? null : null,
        ownerEmail: organization.ownerId ? ownerMap.get(String(organization.ownerId))?.email ?? null : null
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireManager();
    if (currentUser.role !== "super_admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const plan =
      body?.plan === "starter" || body?.plan === "team" || body?.plan === "enterprise" || body?.plan === "trial" ? body.plan : "trial";

    if (!name) {
      return NextResponse.json({ message: "Organization name is required" }, { status: 400 });
    }

    await connectToDatabase();
    const organization = await Organization.create({ name, plan });

    await logAuditEvent({
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      action: "organization.created",
      entityType: "organization",
      entityId: String(organization._id),
      details: { name, plan }
    });

    return NextResponse.json({
      organization: {
        id: String(organization._id),
        name: organization.name,
        ownerId: organization.ownerId ? String(organization.ownerId) : null,
        plan: organization.plan,
        createdAt: organization.createdAt?.toISOString?.() ?? null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500 });
  }
}
