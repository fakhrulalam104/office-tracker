import { RegexDebuggerPageClient } from "@/components/pages/RegexDebuggerPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function RegexDebuggerPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <RegexDebuggerPageClient />;
}