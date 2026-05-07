import Link from "next/link";
import { AdminPageFrame } from "@/components/pages/admin/AdminPageFrame";
import { AdminUsersClient } from "@/components/pages/admin/AdminUsersClient";
import { requireUser } from "@/lib/require-auth";

export default async function AdminUsersPage() {
  const user = await requireUser();

  return (
    <AdminPageFrame
      eyebrow="User Management"
      title="Users"
      description="Review every member account, check role and status, and open the dedicated edit screen for deeper changes."
      action={
        <Link
          href="/admin/users/new"
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Add user
        </Link>
      }
    >
      <AdminUsersClient currentRole={user.role} currentUserId={user.id} />
    </AdminPageFrame>
  );
}
