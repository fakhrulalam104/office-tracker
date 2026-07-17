import { FilePermissionFixerPageClient } from "@/components/pages/FilePermissionFixerPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function FilePermissionFixerPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) { redirect("/admin"); }
  return <FilePermissionFixerPageClient />;
}