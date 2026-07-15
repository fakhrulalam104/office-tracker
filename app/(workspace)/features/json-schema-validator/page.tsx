import { JsonSchemaValidatorPageClient } from "@/components/pages/JsonSchemaValidatorPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function JsonSchemaValidatorPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <JsonSchemaValidatorPageClient />;
}