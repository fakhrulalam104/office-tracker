import { GithubRepoAnalyzerPageClient } from "@/components/pages/GithubRepoAnalyzerPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function GithubRepoAnalyzerPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <GithubRepoAnalyzerPageClient />;
}
