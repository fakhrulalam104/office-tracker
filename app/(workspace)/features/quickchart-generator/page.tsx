import { QuickChartGeneratorPageClient } from "@/components/pages/QuickChartGeneratorPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function QuickChartGeneratorPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <QuickChartGeneratorPageClient />;
}
