import { ColorPaletteGeneratorPageClient } from "@/components/pages/ColorPaletteGeneratorPageClient";
import { requireUser } from "@/lib/require-auth";
import { canAccessTracking } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function ColorPaletteGeneratorPage() {
  const user = await requireUser();
  if (!canAccessTracking(user.role)) {
    redirect("/admin");
  }
  return <ColorPaletteGeneratorPageClient />;
}