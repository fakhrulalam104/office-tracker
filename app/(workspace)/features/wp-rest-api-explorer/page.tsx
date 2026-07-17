import { WpRestApiExplorerPageClient } from "@/components/pages/WpRestApiExplorerPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function WpRestApiExplorerPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <WpRestApiExplorerPageClient />;
}