import { BatchImageResizerPageClient } from "@/components/pages/BatchImageResizerPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function BatchImageResizerPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <BatchImageResizerPageClient />;
}