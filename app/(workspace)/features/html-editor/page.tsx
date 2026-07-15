import { HtmlEditorPageClient } from "@/components/pages/HtmlEditorPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function HtmlEditorPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <HtmlEditorPageClient />;
}
