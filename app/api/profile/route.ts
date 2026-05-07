import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/admin";
import { connectToDatabase } from "@/lib/mongodb";
import { isSuperAdminEmail } from "@/lib/roles";
import { User } from "@/models/User";

export const runtime = "nodejs";

function normalizeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function GET() {
  try {
    const currentUser = await requireAppUser();
    await connectToDatabase();

    const user = await User.findById(currentUser.id).select(
      "name email role organizationId phone jobTitle department employeeCode location bio emergencyContactName emergencyContactPhone createdAt"
    );

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId ? String(user.organizationId) : null,
        phone: user.phone ?? "",
        jobTitle: user.jobTitle ?? "",
        department: user.department ?? "",
        employeeCode: user.employeeCode ?? "",
        location: user.location ?? "",
        bio: user.bio ?? "",
        emergencyContactName: user.emergencyContactName ?? "",
        emergencyContactPhone: user.emergencyContactPhone ?? "",
        createdAt: user.createdAt?.toISOString?.() ?? null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await requireAppUser();
    const body = await request.json();
    await connectToDatabase();

    const user = await User.findById(currentUser.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const nextEmail = typeof body?.email === "string" ? body.email.toLowerCase().trim() : user.email;
    const nextName = normalizeText(body?.name, 120);

    if (nextName.length < 2) {
      return NextResponse.json({ message: "Name must be at least 2 characters." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
    }

    if (user.role === "super_admin" && nextEmail !== user.email) {
      return NextResponse.json({ message: "Super admin email cannot be changed." }, { status: 400 });
    }

    if (user.role !== "super_admin" && isSuperAdminEmail(nextEmail)) {
      return NextResponse.json({ message: "That email is reserved." }, { status: 400 });
    }

    if (nextEmail !== user.email) {
      const existingUser = await User.findOne({ email: nextEmail, _id: { $ne: user._id } }).select("_id").lean();
      if (existingUser) {
        return NextResponse.json({ message: "This email is already in use." }, { status: 409 });
      }
    }

    user.name = nextName;
    user.email = nextEmail;
    user.phone = normalizeText(body?.phone, 40);
    user.jobTitle = normalizeText(body?.jobTitle, 80);
    user.department = normalizeText(body?.department, 80);
    user.employeeCode = normalizeText(body?.employeeCode, 80);
    user.location = normalizeText(body?.location, 120);
    user.bio = normalizeText(body?.bio, 500);
    user.emergencyContactName = normalizeText(body?.emergencyContactName, 120);
    user.emergencyContactPhone = normalizeText(body?.emergencyContactPhone, 40);

    await user.save();

    return NextResponse.json({
      profile: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId ? String(user.organizationId) : null,
        phone: user.phone ?? "",
        jobTitle: user.jobTitle ?? "",
        department: user.department ?? "",
        employeeCode: user.employeeCode ?? "",
        location: user.location ?? "",
        bio: user.bio ?? "",
        emergencyContactName: user.emergencyContactName ?? "",
        emergencyContactPhone: user.emergencyContactPhone ?? "",
        createdAt: user.createdAt?.toISOString?.() ?? null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
