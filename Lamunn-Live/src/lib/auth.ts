import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@lamunn/db-live";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  // Distinct cookie name so this app's session doesn't collide with the other Lamunn apps,
  // which all run on localhost (shared cookie domain, different ports) and would otherwise
  // fight over the default "next-auth.session-token" cookie name.
  cookies: {
    sessionToken: {
      name: "lamunn-live.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/" },
    },
  },
  providers: [
    CredentialsProvider({
      id: "live-credentials",
      name: "พนักงาน/แอดมิน",
      credentials: {
        email: { label: "อีเมล", type: "text" },
        password: { label: "รหัสผ่าน", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const staff = await prisma.staffUser.findUnique({ where: { email: credentials.email } });
        if (!staff || !staff.isActive) return null;

        const valid = await bcrypt.compare(credentials.password, staff.passwordHash);
        if (!valid) return null;

        return {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.staffId = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        staffId: token.staffId,
        role: token.role,
      };
      return session;
    },
  },
};
