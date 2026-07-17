import { GutenbergBlockBoilerplatePageClient } from "@/components/pages/GutenbergBlockBoilerplatePageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function GutenbergBlockBoilerplatePage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <GutenbergBlockBoilerplatePageClient />;
}