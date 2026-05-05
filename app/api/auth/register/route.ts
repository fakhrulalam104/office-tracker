import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export const runtime = "nodejs";

function validateRegistration(body: unknown) {
  const errors: Record<string, string> = {};
  const payload = body as {
    name?: string;
    email?: string;
    password?: string;
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
    const body = await request.json();
    const { valid, errors, payload } = validateRegistration(body);

    if (!valid) {
      return NextResponse.json({ message: "Validation failed", fieldErrors: errors }, { status: 400 });
    }

    const name = payload.name!.trim();
    const email = payload.email!.toLowerCase().trim();
    const password = payload.password!;

    await connectToDatabase();

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return NextResponse.json(
        { message: "Email already exists", fieldErrors: { email: "This email is already registered." } },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await User.create({
      name,
      email,
      password: hashedPassword
    });

    return NextResponse.json({ message: "Account created successfully" }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
