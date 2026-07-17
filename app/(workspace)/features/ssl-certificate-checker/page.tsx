import { SslCertificateCheckerPageClient } from "@/components/pages/SslCertificateCheckerPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function SslCertificateCheckerPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <SslCertificateCheckerPageClient />;
}