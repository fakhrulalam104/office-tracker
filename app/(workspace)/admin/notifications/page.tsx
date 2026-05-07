import { AdminPageFrame } from "@/components/pages/admin/AdminPageFrame";
import { AdminNotificationsClient } from "@/components/pages/admin/AdminNotificationsClient";

export default function AdminNotificationsPage() {
  return (
    <AdminPageFrame
      eyebrow="Communications"
      title="Notifications"
      description="Compose broadcasts and review sent notices on a page built specifically for team communication."
    >
      <AdminNotificationsClient />
    </AdminPageFrame>
  );
}
