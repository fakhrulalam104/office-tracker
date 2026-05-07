import { NotificationsPageClient } from "@/components/pages/NotificationsPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function NotificationsPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }

  return <NotificationsPageClient />;
}
