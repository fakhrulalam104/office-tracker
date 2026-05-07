import { AdminPageFrame } from "@/components/pages/admin/AdminPageFrame";
import { AdminUserFormClient } from "@/components/pages/admin/AdminUserFormClient";
import { requireUser } from "@/lib/require-auth";

export default async function NewAdminUserPage() {
  const user = await requireUser();

  return (
    <AdminPageFrame
      eyebrow="User Management"
      title="Add User"
      description="Create a new member account with the right role, organization, and initial password."
    >
      <AdminUserFormClient mode="create" currentRole={user.role} currentUserId={user.id} />
    </AdminPageFrame>
  );
}
