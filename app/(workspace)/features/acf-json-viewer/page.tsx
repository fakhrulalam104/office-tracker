import { AcfJsonViewerPageClient } from "@/components/pages/AcfJsonViewerPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function AcfJsonViewerPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <AcfJsonViewerPageClient />;
}