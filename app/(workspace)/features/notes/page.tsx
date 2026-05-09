import { redirect } from "next/navigation";
import { NotesPageClient } from "@/components/pages/NotesPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";

export default async function NotesPage() {
  const user = await requireUser();

  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }

  return <NotesPageClient />;
}
