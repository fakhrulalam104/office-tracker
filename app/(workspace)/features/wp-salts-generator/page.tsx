import { WpSaltsGeneratorPageClient } from "@/components/pages/WpSaltsGeneratorPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function WpSaltsGeneratorPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <WpSaltsGeneratorPageClient />;
}