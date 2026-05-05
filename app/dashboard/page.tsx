import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { DashboardClient } from "@/components/Dashboard/DashboardClient";
import { parseMonthKey, toMonthKey } from "@/lib/utils";

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { month?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
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
