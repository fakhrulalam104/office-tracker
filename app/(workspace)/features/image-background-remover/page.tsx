import { redirect } from "next/navigation";
import { ImageBackgroundRemoverPageClient } from "@/components/pages/ImageBackgroundRemoverPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";

export default async function ImageBackgroundRemoverPage() {
  const user = await requireUser();

  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }

  return <ImageBackgroundRemoverPageClient />;
}
