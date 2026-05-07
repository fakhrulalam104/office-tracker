import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { requireUser } from "@/lib/require-auth";
import { canManageTeam } from "@/lib/roles";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  if (!canManageTeam(user.role)) {
    redirect("/dashboard");
  }

  return <AppShell userName={user.name} role={user.role}>{children}</AppShell>;
}
