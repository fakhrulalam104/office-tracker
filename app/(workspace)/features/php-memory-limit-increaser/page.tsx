import { PhpMemoryLimitIncreaserPageClient } from "@/components/pages/PhpMemoryLimitIncreaserPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function PhpMemoryLimitIncreaserPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) { redirect("/admin"); }
  return <PhpMemoryLimitIncreaserPageClient />;
}