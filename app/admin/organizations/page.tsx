import { AdminPageFrame } from "@/components/pages/admin/AdminPageFrame";
import { AdminOrganizationsClient } from "@/components/pages/admin/AdminOrganizationsClient";
import { requireUser } from "@/lib/require-auth";

export default async function AdminOrganizationsPage() {
  const user = await requireUser();

  return (
    <AdminPageFrame
      eyebrow="Organization Management"
      title="Organizations"
      description="Review workspace ownership and plan distribution from a dedicated organization management page."
    >
      <AdminOrganizationsClient canCreate={user.role === "super_admin"} />
    </AdminPageFrame>
  );
}
