import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { canManageTeam, canReviewApprovals, normalizeUserRole } from "@/lib/roles";
import { User } from "@/models/User";
import type { AppUser } from "@/types";

export async function requireAppUser(): Promise<AppUser> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return {
    id: session.user.id,
    name: session.user.name ?? "Team member",
    email: session.user.email ?? "",
    role: normalizeUserRole(session.user.role, session.user.email),
    organizationId: session.user.organizationId ?? null
  };
}

export async function requireManager() {
  const user = await requireAppUser();
  if (!canManageTeam(user.role)) {
    throw new Error("Forbidden");
  }

  return user;
}

export async function requireReviewer() {
  const user = await requireAppUser();
  if (!canReviewApprovals(user.role)) {
    throw new Error("Forbidden");
  }

  return user;
}

export async function getManagedUserIds(currentUser: AppUser) {
  await connectToDatabase();

  if (currentUser.role === "super_admin") {
    const users = await User.find({}).select("_id").lean();
    return users.map((user) => String(user._id));
  }

  const users = await User.find({ organizationId: currentUser.organizationId }).select("_id").lean();
  return users.map((user) => String(user._id));
}

export function buildScopeQuery(currentUser: AppUser) {
  if (currentUser.role === "super_admin") {
    return {};
  }

  return { organizationId: currentUser.organizationId };
}
