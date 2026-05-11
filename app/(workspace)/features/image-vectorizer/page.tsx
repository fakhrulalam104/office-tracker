import { redirect } from "next/navigation";
import { ImageVectorizerPageClient } from "@/components/pages/ImageVectorizerPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";

export default async function ImageVectorizerPage() {
  const user = await requireUser();

  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }

  return <ImageVectorizerPageClient />;
}
