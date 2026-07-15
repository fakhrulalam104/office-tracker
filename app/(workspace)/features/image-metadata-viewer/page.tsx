import { ImageMetadataViewerPageClient } from "@/components/pages/ImageMetadataViewerPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function ImageMetadataViewerPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <ImageMetadataViewerPageClient />;
}