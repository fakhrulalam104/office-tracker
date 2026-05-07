import { AdminPageFrame } from "@/components/pages/admin/AdminPageFrame";
import { AdminApprovalsClient } from "@/components/pages/admin/AdminApprovalsClient";

export default function AdminApprovalsPage() {
  return (
    <AdminPageFrame
      eyebrow="Approval Management"
      title="Approvals"
      description="Handle leave, expense, and correction requests from one dedicated queue."
    >
      <AdminApprovalsClient />
    </AdminPageFrame>
  );
}
