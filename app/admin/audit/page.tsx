import { AdminPageFrame } from "@/components/pages/admin/AdminPageFrame";
import { AdminAuditClient } from "@/components/pages/admin/AdminAuditClient";

export default function AdminAuditPage() {
  return (
    <AdminPageFrame
      eyebrow="Security And Compliance"
      title="Audit Log"
      description="Inspect the recorded history of user, organization, approval, and notification changes."
    >
      <AdminAuditClient />
    </AdminPageFrame>
  );
}
