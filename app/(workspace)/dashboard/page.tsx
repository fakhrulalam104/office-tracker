import { DashboardClient } from "@/components/Dashboard/DashboardClient";
import { parseMonthKey, toMonthKey } from "@/lib/utils";
import { requireUser } from "@/lib/require-auth";
import { authDebug } from "@/lib/auth-debug";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  authDebug("dashboard.auth-start", {
    requestedMonth: params?.month ?? null
  });
  const user = await requireUser();

  authDebug("dashboard.auth-result", {
    hasSession: true,
    hasUserId: Boolean(user.id),
    email: user.email
  });

  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }

  const month = parseMonthKey(params?.month);
  const currentMonth = toMonthKey(new Date());

  return <DashboardClient initialMonth={month ?? currentMonth} />;
}
