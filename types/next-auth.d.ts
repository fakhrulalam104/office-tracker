import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/types";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      organizationId?: string | null;
    };
  }

  interface User {
    id: string;
    role?: UserRole;
    organizationId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    name?: string | null;
    role?: UserRole;
    organizationId?: string | null;
  }
}
