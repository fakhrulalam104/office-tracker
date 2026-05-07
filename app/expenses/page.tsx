import { AppShell } from "@/components/layout/AppShell";
import { ExpensePageClient } from "@/components/pages/ExpensePageClient";
import { requireUser } from "@/lib/require-auth";

export default async function ExpensesPage() {
  const user = await requireUser();

  return (
    <AppShell userName={user.name}>
      <ExpensePageClient />
    </AppShell>
  );
}
