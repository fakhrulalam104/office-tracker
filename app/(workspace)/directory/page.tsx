import { DirectoryPageClient } from "@/components/pages/DirectoryPageClient";
import { requireUser } from "@/lib/require-auth";

export default async function DirectoryPage() {
  await requireUser();
  return <DirectoryPageClient />;
}
