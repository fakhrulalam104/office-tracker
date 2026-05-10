import { SearchPageClient } from "@/components/pages/SearchPageClient";
import { requireUser } from "@/lib/require-auth";

export default async function SearchPage() {
  await requireUser();

  return <SearchPageClient />;
}
