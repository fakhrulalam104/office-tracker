import { DbRepairOptimizerPageClient } from "@/components/pages/DbRepairOptimizerPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function DbRepairOptimizerPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) { redirect("/admin"); }
  return <DbRepairOptimizerPageClient />;
}