import { AppShell } from "@/components/layout/AppShell";
import { NotificationsPageClient } from "@/components/pages/NotificationsPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function NotificationsPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }

  return (
    <AppShell userName={user.name} role={user.role}>
      <NotificationsPageClient />
    </AppShell>
  );
}
