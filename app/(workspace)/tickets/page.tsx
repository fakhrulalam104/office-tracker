import { WorkspaceItemsPageClient } from "@/components/pages/WorkspaceItemsPageClient";
import { requireUser } from "@/lib/require-auth";

export default async function TicketsPage() {
  await requireUser();
  return <WorkspaceItemsPageClient type="ticket" />;
}
