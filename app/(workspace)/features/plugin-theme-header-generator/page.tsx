import { PluginThemeHeaderGeneratorPageClient } from "@/components/pages/PluginThemeHeaderGeneratorPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function PluginThemeHeaderGeneratorPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <PluginThemeHeaderGeneratorPageClient />;
}