import { JsonToTypescriptPageClient } from "@/components/pages/JsonToTypescriptPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function JsonToTypescriptPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <JsonToTypescriptPageClient />;
}