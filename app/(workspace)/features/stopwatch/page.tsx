import { StopwatchPageClient } from "@/components/pages/StopwatchPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function StopwatchPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }

  return <StopwatchPageClient />;
}
