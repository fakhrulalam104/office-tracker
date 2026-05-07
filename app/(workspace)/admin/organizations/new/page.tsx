import { redirect } from "next/navigation";
import { AdminPageFrame } from "@/components/pages/admin/AdminPageFrame";
import { AdminOrganizationFormClient } from "@/components/pages/admin/AdminOrganizationFormClient";
import { requireUser } from "@/lib/require-auth";

export default async function NewOrganizationPage() {
  const user = await requireUser();
  if (user.role !== "super_admin") {
    redirect("/admin/organizations");
  }

  return (
    <AdminPageFrame
      eyebrow="Organization Management"
      title="Add Organization"
      description="Create a new workspace and choose the starting plan before you add people into it."
    >
      <AdminOrganizationFormClient />
    </AdminPageFrame>
  );
}
