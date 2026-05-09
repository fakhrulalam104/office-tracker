import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAuthSecret, getAuthSecretSource } from "@/lib/auth-env";
import { authDebug, authDebugError } from "@/lib/auth-debug";
import { normalizeUserRole } from "@/lib/roles";

const sessionMaxAge = 30 * 24 * 60 * 60;

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Auth.js needs to trust the incoming host header for local/prod requests
  // in this app setup, otherwise it returns the generic "server configuration"
  // error page before the credentials flow can run.
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: sessionMaxAge
  },
  pages: {
    signIn: "/login"
  },
  debug: true,
  logger: {
    error(error) {
      authDebugError("nextauth.error", error);
    },
    warn(code) {
      authDebug("nextauth.warn", { code });
    },
    debug(message, metadata) {
      authDebug("nextauth.debug", { message, metadata });
    }
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const payload = credentials as Partial<Record<"email" | "password" | "flowId", unknown>> | undefined;
        const email = typeof payload?.email === "string" ? payload.email.toLowerCase().trim() : "";
        const password = typeof payload?.password === "string" ? payload.password : "";
        const flowId = typeof payload?.flowId === "string" ? payload.flowId : "missing-flow-id";

        authDebug("authorize.start", {
          flowId,
          email,
          hasEmail: Boolean(email),
          hasPassword: Boolean(password),
          authSecretSource: getAuthSecretSource(),
          nodeEnv: process.env.NODE_ENV
        });

        if (!email || !password) {
          authDebug("authorize.invalid-input", {
            flowId,
            email,
            hasEmail: Boolean(email),
            hasPassword: Boolean(password)
          });
          return null;
        }

        try {
          authDebug("authorize.db-connect-start", { flowId, email });
          await connectToDatabase();
          authDebug("authorize.db-connect-success", { flowId, email });

          authDebug("authorize.user-lookup-start", { flowId, email });
          const user = await User.findOne({ email });
          authDebug("authorize.user-lookup-result", {
            flowId,
            email,
            foundUser: Boolean(user),
            userId: user?._id?.toString() ?? null,
            hasPasswordHash: Boolean(user?.password)
          });

          if (!user) {
            authDebug("authorize.user-missing", { flowId, email });
            return null;
          }

          authDebug("authorize.password-compare-start", {
            flowId,
            email,
            userId: user._id.toString()
          });
          const matches = await bcrypt.compare(password, user.password);
          authDebug("authorize.password-compare-result", {
            flowId,
            email,
            userId: user._id.toString(),
            matches
          });

          if (!matches) {
            return null;
          }

          authDebug("authorize.success", {
            flowId,
            email,
            userId: user._id.toString()
          });

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: normalizeUserRole(user.role, user.email),
            designation: user.designation ?? "User",
            organizationId: user.organizationId?.toString() ?? null
          };
        } catch (error) {
          authDebugError("authorize.exception", error, { flowId, email });
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      authDebug("jwt.callback-start", {
        trigger,
        hasUser: Boolean(user),
        incomingUserId: user?.id ?? null,
        tokenHasUserId: Boolean(token.userId)
      });

      if (user) {
        token.userId = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = normalizeUserRole(user.role, user.email);
        token.designation = user.designation ?? "User";
        token.organizationId = user.organizationId ?? null;
      } else if (token.userId) {
        await connectToDatabase();
        const currentUser = (await User.findById(token.userId).select("name email role designation organizationId").lean()) as
          | {
              name: string;
              email: string;
              role?: string;
              designation?: string | null;
              organizationId?: { toString(): string } | null;
            }
          | null;
        if (currentUser) {
          token.name = currentUser.name;
          token.email = currentUser.email;
          token.role = normalizeUserRole(currentUser.role, currentUser.email);
          token.designation = currentUser.designation?.trim() || "User";
          token.organizationId = currentUser.organizationId?.toString() ?? null;
        }
      }

      authDebug("jwt.callback-complete", {
        trigger,
        tokenHasUserId: Boolean(token.userId),
        tokenEmail: token.email ?? null
      });

      return token;
    },
    async session({ session, token }) {
      authDebug("session.callback-start", {
        hasSessionUser: Boolean(session.user),
        tokenHasUserId: Boolean(token.userId),
        tokenEmail: token.email ?? null
      });

      if (session.user) {
        session.user.id = token.userId ?? "";
        session.user.name = token.name ?? session.user.name ?? null;
        session.user.email = token.email ?? session.user.email ?? null;
        session.user.role = normalizeUserRole(token.role, session.user.email);
        session.user.designation = token.designation?.trim() || "User";
        session.user.organizationId = token.organizationId ?? null;
      }

      authDebug("session.callback-complete", {
        hasSessionUserId: Boolean(session.user?.id),
        sessionEmail: session.user?.email ?? null
      });

      return session;
    }
  },
  secret: getAuthSecret()
});
