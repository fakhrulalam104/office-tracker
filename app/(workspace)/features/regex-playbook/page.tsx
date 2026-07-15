import { RegexPlaybookPageClient } from "@/components/pages/RegexPlaybookPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function RegexPlaybookPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <RegexPlaybookPageClient />;
}