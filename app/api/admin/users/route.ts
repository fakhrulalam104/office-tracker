import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireManager } from "@/lib/admin";
import { logAuditEvent } from "@/lib/audit";
import { connectToDatabase } from "@/lib/mongodb";
import { canAssignRole, normalizeUserRole } from "@/lib/roles";
import { Organization } from "@/models/Organization";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function GET() {
  try {
    const currentUser = await requireManager();
    await connectToDatabase();

    const query = currentUser.role === "super_admin" ? {} : { organizationId: currentUser.organizationId };
    const [users, organizations] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).lean(),
      Organization.find(currentUser.role === "super_admin" ? {} : { _id: currentUser.organizationId }).lean()
    ]);

    const organizationMap = new Map(organizations.map((organization) => [String(organization._id), organization.name]));

    return NextResponse.json({
      users: users.map((user) => ({
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: normalizeUserRole(user.role, user.email),
        organizationId: user.organizationId ? String(user.organizationId) : null,
        organizationName: user.organizationId ? organizationMap.get(String(user.organizationId)) ?? null : null,
        active: user.active !== false,
        createdAt: user.createdAt?.toISOString?.() ?? null
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
    const body = await request.json();

    await connectToDatabase();

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
    const role = normalizeUserRole(body?.role, body?.email);
    const password = typeof body?.password === "string" && body.password.length >= 8 ? body.password : `${Date.now()}-invite-only`;
    const organizationId =
      currentUser.role === "super_admin"
        ? typeof body?.organizationId === "string" && body.organizationId
          ? body.organizationId
          : null
        : currentUser.organizationId;

    if (!name || !email) {
      return NextResponse.json({ message: "Name and email are required" }, { status: 400 });
    }

    if (!canAssignRole(currentUser.role, role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (role !== "super_admin" && !organizationId) {
      return NextResponse.json({ message: "Organization is required for this role" }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 409 });
    }

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role,
      organizationId,
      active: true
    });

    await logAuditEvent({
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      action: "user.created",
      entityType: "user",
      entityId: String(user._id),
      details: { email, role, organizationId }
    });

    return NextResponse.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: normalizeUserRole(user.role, user.email),
        organizationId: user.organizationId ? String(user.organizationId) : null,
        active: user.active !== false
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500 });
  }
}
