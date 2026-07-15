import { MarkdownToSlidesPageClient } from "@/components/pages/MarkdownToSlidesPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function MarkdownToSlidesPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <MarkdownToSlidesPageClient />;
}