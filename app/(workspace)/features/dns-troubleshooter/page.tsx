import { DnsTroubleshooterPageClient } from "@/components/pages/DnsTroubleshooterPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function DnsTroubleshooterPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <DnsTroubleshooterPageClient />;
}
