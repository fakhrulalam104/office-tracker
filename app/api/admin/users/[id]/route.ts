import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { requireManager } from "@/lib/admin";
import { logAuditEvent } from "@/lib/audit";
import { connectToDatabase } from "@/lib/mongodb";
import { canAssignRole, canManageTargetRole, normalizeUserRole } from "@/lib/roles";
import { Organization } from "@/models/Organization";
import { User } from "@/models/User";

export const runtime = "nodejs";

function normalizeDesignation(value: unknown) {
  const designation = typeof value === "string" ? value.trim().slice(0, 80) : "";
  return designation || "User";
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requireManager();

    await connectToDatabase();
    const user = (await User.findOne({ _id: params.id }).lean()) as
      | {
          _id: unknown;
          name: string;
          email: string;
          role?: string;
          designation?: string | null;
          organizationId?: unknown;
          active?: boolean;
          createdAt?: Date;
        }
      | null;
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (currentUser.role !== "super_admin" && String(user.organizationId ?? "") !== String(currentUser.organizationId ?? "")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: normalizeUserRole(user.role, user.email),
        designation: user.designation?.trim() || "User",
        organizationId: user.organizationId ? String(user.organizationId) : null,
        active: user.active !== false,
        createdAt: user.createdAt?.toISOString?.() ?? null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requireManager();
    const body = await request.json();

    await connectToDatabase();
    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (currentUser.role !== "super_admin" && String(user.organizationId ?? "") !== String(currentUser.organizationId ?? "")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const currentRole = normalizeUserRole(user.role, user.email);
    if (!canManageTargetRole(currentUser.role, currentRole) && currentUser.id !== String(user._id)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (currentUser.id === String(user._id) && (body?.active === false || typeof body?.role === "string")) {
      return NextResponse.json({ message: "You cannot deactivate or change your own role from admin tools" }, { status: 400 });
    }

    if (typeof body?.name === "string" && body.name.trim()) {
      user.name = body.name.trim();
    }

    if (typeof body?.role === "string") {
      const nextRole = normalizeUserRole(body.role, user.email);
      if (!canAssignRole(currentUser.role, nextRole)) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      user.role = nextRole;
    }

    if (typeof body?.designation === "string") {
      if (currentUser.role !== "super_admin") {
        return NextResponse.json({ message: "Only super admins can change designations" }, { status: 403 });
      }
      user.designation = normalizeDesignation(body.designation);
    }

    if (typeof body?.active === "boolean") {
      user.active = body.active;
    }

    if (currentUser.role === "super_admin" && typeof body?.organizationId === "string") {
      user.organizationId = body.organizationId || null;
    }

    if (typeof body?.password === "string" && body.password.length >= 8) {
      user.password = await bcrypt.hash(body.password, 12);
    }

    if (normalizeUserRole(user.role, user.email) !== "super_admin" && !user.organizationId) {
      return NextResponse.json({ message: "Organization is required for this role" }, { status: 400 });
    }

    await user.save();

    await logAuditEvent({
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      action: "user.updated",
      entityType: "user",
      entityId: String(user._id),
      details: { role: user.role, designation: user.designation ?? "User", active: user.active }
    });

    return NextResponse.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: normalizeUserRole(user.role, user.email),
        designation: user.designation?.trim() || "User",
        organizationId: user.organizationId ? String(user.organizationId) : null,
        active: user.active !== false
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requireManager();

    await connectToDatabase();
    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (currentUser.id === String(user._id)) {
      return NextResponse.json({ message: "You cannot delete your own account from admin tools" }, { status: 400 });
    }

    if (currentUser.role !== "super_admin" && String(user.organizationId ?? "") !== String(currentUser.organizationId ?? "")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const targetRole = normalizeUserRole(user.role, user.email);
    if (!canManageTargetRole(currentUser.role, targetRole)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await User.deleteOne({ _id: user._id });
    await Organization.updateMany({ ownerId: user._id }, { $set: { ownerId: null } });

    await logAuditEvent({
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      action: "user.deleted",
      entityType: "user",
      entityId: String(user._id),
      details: {
        name: user.name,
        email: user.email,
        role: targetRole
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500 });
  }
}
