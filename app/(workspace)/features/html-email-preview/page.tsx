import { HtmlEmailPreviewPageClient } from "@/components/pages/HtmlEmailPreviewPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function HtmlEmailPreviewPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <HtmlEmailPreviewPageClient />;
}