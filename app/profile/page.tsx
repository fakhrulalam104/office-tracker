import { AppShell } from "@/components/layout/AppShell";
import { ProfilePageClient } from "@/components/pages/ProfilePageClient";
import { requireUser } from "@/lib/require-auth";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <AppShell userName={user.name} role={user.role}>
      <ProfilePageClient />
    </AppShell>
  );
}
