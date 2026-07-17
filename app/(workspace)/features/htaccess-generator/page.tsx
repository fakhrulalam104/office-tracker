import { HtaccessGeneratorPageClient } from "@/components/pages/HtaccessGeneratorPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function HtaccessGeneratorPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <HtaccessGeneratorPageClient />;
}