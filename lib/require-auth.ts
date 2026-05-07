import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { normalizeUserRole } from "@/lib/roles";

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return {
    id: session.user.id,
    name: session.user.name ?? "Team member",
    email: session.user.email ?? "",
    role: normalizeUserRole(session.user.role, session.user.email),
    organizationId: session.user.organizationId ?? null
  };
}
