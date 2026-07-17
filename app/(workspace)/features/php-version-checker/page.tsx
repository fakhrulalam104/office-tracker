import { PhpVersionCheckerPageClient } from "@/components/pages/PhpVersionCheckerPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function PhpVersionCheckerPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) { redirect("/admin"); }
  return <PhpVersionCheckerPageClient />;
}