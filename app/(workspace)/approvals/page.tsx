import { ApprovalsPageClient } from "@/components/pages/ApprovalsPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function ApprovalsPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }

  return <ApprovalsPageClient />;
}
