import { SerializedPhpReplacePageClient } from "@/components/pages/SerializedPhpReplacePageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function SerializedPhpReplacePage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <SerializedPhpReplacePageClient />;
}