import { AppShell } from "@/components/layout/AppShell";
import { InsightsPageClient } from "@/components/pages/InsightsPageClient";
import { requireUser } from "@/lib/require-auth";

export default async function InsightsPage() {
  const user = await requireUser();

  return (
    <AppShell userName={user.name}>
      <InsightsPageClient />
    </AppShell>
  );
}
