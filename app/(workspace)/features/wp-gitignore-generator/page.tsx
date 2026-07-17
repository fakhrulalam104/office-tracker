import { WpGitignoreGeneratorPageClient } from "@/components/pages/WpGitignoreGeneratorPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function WpGitignoreGeneratorPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <WpGitignoreGeneratorPageClient />;
}