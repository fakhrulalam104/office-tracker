import { AdminPageFrame } from "@/components/pages/admin/AdminPageFrame";
import { AdminOverviewClient } from "@/components/pages/admin/AdminOverviewClient";
import { requireUser } from "@/lib/require-auth";

export default async function AdminPage() {
  const user = await requireUser();

  return (
    <AdminPageFrame
      eyebrow={user.role === "super_admin" ? "Super Admin" : "Team Dashboard"}
      title="Admin Dashboard"
      description="Track the health of your workspace with user, organization, approval, and notification totals at a glance."
    >
      <AdminOverviewClient />
    </AdminPageFrame>
  );
}
