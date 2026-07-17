import { PhpExecutionTimeFixerPageClient } from "@/components/pages/PhpExecutionTimeFixerPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function PhpExecutionTimeFixerPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) { redirect("/admin"); }
  return <PhpExecutionTimeFixerPageClient />;
}