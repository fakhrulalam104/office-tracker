import { WpConfigGeneratorPageClient } from "@/components/pages/WpConfigGeneratorPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function WpConfigGeneratorPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <WpConfigGeneratorPageClient />;
}