import { ApiDebuggerPageClient } from "@/components/pages/ApiDebuggerPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function ApiDebuggerPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <ApiDebuggerPageClient />;
}
