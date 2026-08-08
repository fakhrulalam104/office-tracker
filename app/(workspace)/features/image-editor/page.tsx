import { redirect } from "next/navigation";
import { ImageEditorPageClient } from "@/components/pages/ImageEditorPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";

export default async function ImageEditorPage() {
  const user = await requireUser();

  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }

  return <ImageEditorPageClient />;
}