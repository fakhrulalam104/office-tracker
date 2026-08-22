import { NpmPackageInspectorPageClient } from "@/components/pages/NpmPackageInspectorPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function NpmPackageInspectorPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <NpmPackageInspectorPageClient />;
}
