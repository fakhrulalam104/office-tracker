import { WorkspaceItemsPageClient } from "@/components/pages/WorkspaceItemsPageClient";
import { requireUser } from "@/lib/require-auth";

export default async function AssetsPage() {
  await requireUser();
  return <WorkspaceItemsPageClient type="asset" />;
}
