import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

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
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.toLowerCase().trim() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          return null;
        }

        await connectToDatabase();
        const user = await User.findOne({ email });

        if (!user) {
          return null;
        }

        const matches = await bcrypt.compare(password, user.password);
        if (!matches) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.name = user.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId ?? "";
        session.user.name = token.name ?? session.user.name ?? null;
        session.user.email = token.email ?? session.user.email ?? null;
      }

      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
});
