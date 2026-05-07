import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import { authDebug, authDebugError } from "@/lib/auth-debug";
import { isSuperAdminEmail } from "@/lib/roles";

export const runtime = "nodejs";

function validateRegistration(body: unknown) {
  const errors: Record<string, string> = {};
  const payload = body as {
    name?: string;
    email?: string;
    password?: string;
    company?: string;
  };

  if (!payload?.name || payload.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  if (!payload?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!payload?.password || payload.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    payload
  };
}

export async function POST(request: Request) {
  try {
    authDebug("register.request-start", {
      url: request.url
    });

    const body = await request.json();
    const { valid, errors, payload } = validateRegistration(body);
    const email = payload?.email?.toLowerCase().trim() ?? "";

    authDebug("register.validation-result", {
      email,
      valid,
      errorFields: Object.keys(errors)
    });

    if (!valid) {
      return NextResponse.json({ message: "Validation failed", fieldErrors: errors }, { status: 400 });
    }

    const name = payload.name!.trim();
    const password = payload.password!;
    const company = payload.company?.trim() || `${name}'s Workspace`;

    authDebug("register.db-connect-start", { email });
    await connectToDatabase();
    authDebug("register.db-connect-success", { email });

    const existingUser = await User.findOne({ email }).lean();
    authDebug("register.existing-user-check", {
      email,
      exists: Boolean(existingUser)
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already exists", fieldErrors: { email: "This email is already registered." } },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    authDebug("register.password-hashed", {
      email,
      hashLength: hashedPassword.length
    });

    const role = isSuperAdminEmail(email) ? "super_admin" : "owner";
    const organization = await Organization.create({
      name: isSuperAdminEmail(email) ? "Office Tracker Super Admin" : company,
      plan: "trial"
    });

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      organizationId: organization._id
    });

    organization.ownerId = user._id;
    await organization.save();

    authDebug("register.user-created", {
      email,
      userId: user._id.toString()
    });

    return NextResponse.json({ message: "Account created successfully" }, { status: 201 });
  } catch (error) {
    authDebugError("register.exception", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
