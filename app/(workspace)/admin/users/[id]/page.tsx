import { AdminPageFrame } from "@/components/pages/admin/AdminPageFrame";
import { AdminUserFormClient } from "@/components/pages/admin/AdminUserFormClient";
import { requireUser } from "@/lib/require-auth";

export default async function EditAdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  return (
    <AdminPageFrame
      eyebrow="User Management"
      title="Edit User"
      description="Update account details, change role, move organization, reset password, or remove access."
    >
      <AdminUserFormClient mode="edit" userId={id} currentRole={user.role} currentUserId={user.id} />
    </AdminPageFrame>
  );
}
