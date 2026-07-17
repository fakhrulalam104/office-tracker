import { CssSpecificityCalculatorPageClient } from "@/components/pages/CssSpecificityCalculatorPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function CssSpecificityCalculatorPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <CssSpecificityCalculatorPageClient />;
}