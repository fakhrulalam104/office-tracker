import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { DashboardClient } from "@/components/Dashboard/DashboardClient";
import { parseMonthKey, toMonthKey } from "@/lib/utils";
import { authDebug } from "@/lib/auth-debug";

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { month?: string };
}) {
  authDebug("dashboard.auth-start", {
    requestedMonth: searchParams?.month ?? null
  });
  const session = await auth();

  authDebug("dashboard.auth-result", {
    hasSession: Boolean(session),
    hasUserId: Boolean(session?.user?.id),
    email: session?.user?.email ?? null
  });

  if (!session?.user?.id) {
    authDebug("dashboard.redirect-login");
    redirect("/login");
  }

  const month = parseMonthKey(searchParams?.month);
  const currentMonth = toMonthKey(new Date());

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar userName={session.user.name ?? "Team member"} />
      <DashboardClient initialMonth={month ?? currentMonth} />
    </main>
  );
}
