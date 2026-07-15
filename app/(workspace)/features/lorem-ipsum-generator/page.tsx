import { LoremIpsumGeneratorPageClient } from "@/components/pages/LoremIpsumGeneratorPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function LoremIpsumGeneratorPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <LoremIpsumGeneratorPageClient />;
}