import { AppShell } from "@/components/layout/AppShell";
import { SettingsPageClient } from "@/components/pages/SettingsPageClient";
import { requireUser } from "@/lib/require-auth";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <AppShell userName={user.name}>
      <SettingsPageClient />
    </AppShell>
  );
}
