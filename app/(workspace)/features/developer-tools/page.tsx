import { redirect } from "next/navigation";
import { DeveloperToolsPageClient } from "@/components/pages/DeveloperToolsPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";

export default async function DeveloperToolsPage() {
  const user = await requireUser();

  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }

  return <DeveloperToolsPageClient />;
}
