import { ReportsPageClient } from "@/components/pages/ReportsPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }

  return <ReportsPageClient />;
}
