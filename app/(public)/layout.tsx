import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { auth } from "@/lib/auth";
import { normalizeUserRole } from "@/lib/roles";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (session?.user?.id) {
    const role = normalizeUserRole(session.user.role, session.user.email);
    const name = session.user.name ?? "Team member";
    const designation = session.user.designation?.trim() || "User";

    return (
      <AppShell userName={name} designation={designation} role={role}>
        {children}
      </AppShell>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {children}
    </main>
  );
}

