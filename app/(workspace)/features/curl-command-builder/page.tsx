import { CurlCommandBuilderPageClient } from "@/components/pages/CurlCommandBuilderPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function CurlCommandBuilderPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <CurlCommandBuilderPageClient />;
}