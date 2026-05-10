import { DashboardSettingsPageClient } from "@/components/pages/DashboardSettingsPageClient";
import { requireUser } from "@/lib/require-auth";

export default async function DashboardSettingsPage() {
  await requireUser();
  return <DashboardSettingsPageClient />;
}
