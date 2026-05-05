import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { authDebug } from "@/lib/auth-debug";

export default async function HomePage() {
  authDebug("home.auth-start");
  const session = await auth();
  authDebug("home.auth-result", {
    hasSession: Boolean(session),
    hasUserId: Boolean(session?.user?.id),
    email: session?.user?.email ?? null
  });
  redirect(session?.user?.id ? "/dashboard" : "/login");
}
