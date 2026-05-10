import { WorkspaceItemsPageClient } from "@/components/pages/WorkspaceItemsPageClient";
import { requireUser } from "@/lib/require-auth";

export default async function LeavePage() {
  await requireUser();
  return <WorkspaceItemsPageClient type="leave" />;
}
