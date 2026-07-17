import { WpErrorLookupPageClient } from "@/components/pages/WpErrorLookupPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function WpErrorLookupPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) { redirect("/admin"); }
  return <WpErrorLookupPageClient />;
}