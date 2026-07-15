import { ResponsiveCheckerPageClient } from "@/components/pages/ResponsiveCheckerPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function ResponsiveCheckerPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <ResponsiveCheckerPageClient />;
}
