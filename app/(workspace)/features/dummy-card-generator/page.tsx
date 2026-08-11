import { redirect } from "next/navigation";
import { DummyCardGeneratorPageClient } from "@/components/pages/DummyCardGeneratorPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";

export default async function DummyCardGeneratorPage() {
  const user = await requireUser();

  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }

  return <DummyCardGeneratorPageClient />;
}
