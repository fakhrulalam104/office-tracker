import { RobotsTxtGeneratorPageClient } from "@/components/pages/RobotsTxtGeneratorPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function RobotsTxtGeneratorPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <RobotsTxtGeneratorPageClient />;
}