import { ExpensePageClient } from "@/components/pages/ExpensePageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function ExpensesPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }

  return <ExpensePageClient />;
}
