import { redirect } from "next/navigation";
import { ImageConverterPageClient } from "@/components/pages/ImageConverterPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";

export default async function ImageConverterPage() {
  const user = await requireUser();

  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }

  return <ImageConverterPageClient />;
}
