import { AdminPageFrame } from "@/components/pages/admin/AdminPageFrame";
import { AdminUserFormClient } from "@/components/pages/admin/AdminUserFormClient";
import { requireUser } from "@/lib/require-auth";

export default async function EditAdminUserPage({ params }: { params: { id: string } }) {
  const user = await requireUser();

  return (
    <AdminPageFrame
      eyebrow="User Management"
      title="Edit User"
      description="Update account details, change role, move organization, reset password, or remove access."
    >
      <AdminUserFormClient mode="edit" userId={params.id} currentRole={user.role} currentUserId={user.id} />
    </AdminPageFrame>
  );
}
