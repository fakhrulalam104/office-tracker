import { NginxConfigGeneratorPageClient } from "@/components/pages/NginxConfigGeneratorPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function NginxConfigGeneratorPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) { redirect("/admin"); }
  return <NginxConfigGeneratorPageClient />;
}