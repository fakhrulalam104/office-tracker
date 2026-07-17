import { WpCronDebuggerPageClient } from "@/components/pages/WpCronDebuggerPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function WpCronDebuggerPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) { redirect("/admin"); }
  return <WpCronDebuggerPageClient />;
}