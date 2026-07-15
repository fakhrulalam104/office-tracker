import { PomodoroTimerPageClient } from "@/components/pages/PomodoroTimerPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function PomodoroTimerPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <PomodoroTimerPageClient />;
}