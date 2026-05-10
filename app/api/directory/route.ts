import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { normalizeUserRole } from "@/lib/roles";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function GET() {
  try {
    const currentUser = await requireAppUser();
    await connectToDatabase();

    const query = currentUser.role === "super_admin" ? {} : { organizationId: currentUser.organizationId, active: { $ne: false } };
    const users = await User.find(query)
      .select("name email role designation organizationId phone jobTitle department employeeCode location bio socialLinks createdAt")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      users: users.map((user) => ({
        id: String(user._id),
        name: user.name ?? "Team member",
        email: user.email ?? "",
        role: normalizeUserRole(user.role, user.email),
        designation: user.designation?.trim() || user.jobTitle || "User",
        phone: user.phone ?? "",
        jobTitle: user.jobTitle ?? "",
        department: user.department ?? "",
        employeeCode: user.employeeCode ?? "",
        location: user.location ?? "",
        bio: user.bio ?? "",
        socialLinks: user.socialLinks && typeof user.socialLinks === "object" ? user.socialLinks : {},
        createdAt: user.createdAt?.toISOString?.() ?? ""
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
