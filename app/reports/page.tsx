import { AppShell } from "@/components/layout/AppShell";
import { ReportsPageClient } from "@/components/pages/ReportsPageClient";
import { requireUser } from "@/lib/require-auth";

export default async function ReportsPage() {
  const user = await requireUser();

  return (
    <AppShell userName={user.name}>
      <ReportsPageClient />
    </AppShell>
  );
}
