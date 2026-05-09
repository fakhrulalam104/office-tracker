import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { requireUser } from "@/lib/require-auth";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell userName={user.name} designation={user.designation} role={user.role}>
      {children}
    </AppShell>
  );
}
