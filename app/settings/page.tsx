import { AppShell } from "@/components/layout/AppShell";
import { SettingsPageClient } from "@/components/pages/SettingsPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }

  return (
    <AppShell userName={user.name} role={user.role}>
      <SettingsPageClient />
    </AppShell>
  );
}
