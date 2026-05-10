import { WorkspaceItemsPageClient } from "@/components/pages/WorkspaceItemsPageClient";
import { requireUser } from "@/lib/require-auth";

export default async function ProjectsPage() {
  const user = await requireUser();
  return <WorkspaceItemsPageClient type="project" canCreate={user.role === "coordinator"} />;
}
