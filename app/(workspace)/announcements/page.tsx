import { WorkspaceItemsPageClient } from "@/components/pages/WorkspaceItemsPageClient";
import { requireUser } from "@/lib/require-auth";

export default async function AnnouncementsPage() {
  const user = await requireUser();
  const canCreateAnnouncements = user.role === "super_admin" || user.role === "hr";

  return <WorkspaceItemsPageClient type="announcement" canCreate={canCreateAnnouncements} />;
}
