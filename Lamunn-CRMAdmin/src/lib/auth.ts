import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@lamunn/db";
import { verifyWithIms } from "@/lib/imsAuth";

/**
 * Staff/admin-only auth for the back office. Customer auth (LINE / phone+OTP) lives
 * in the separate Lamunn-CRM app — the two apps no longer share a NextAuth instance
 * or session, since they're different origins now.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      id: "staff-credentials",
      name: "พนักงาน/แอดมิน",
      credentials: {
        email: { label: "อีเมล", type: "text" },
        password: { label: "รหัสผ่าน", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        // IMS lists the same addresses as "Lamunn.saimai…" — match however staff type it.
        const staff = await prisma.staffUser.findFirst({ where: { email: { equals: credentials.email.trim(), mode: "insensitive" } } });
        if (!staff || !staff.isActive) return null;

        // 1) The IMS password (Supabase Auth) — same login the branch uses every day.
        // 2) Otherwise the CRM's own hash: HQ accounts and branches the IMS doesn't have yet.
        //    Branch passwords are hashed from their lowercase form, so typing them in
        //    any letter case works; older hashes of mixed-case passwords still match as typed.
        const typed = credentials.password.trim();
        const valid =
          (await verifyWithIms(staff.email, typed)) ||
          (await bcrypt.compare(typed, staff.passwordHash)) ||
          (await bcrypt.compare(typed.toLowerCase(), staff.passwordHash));
        if (!valid) return null;

        return {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          branchId: staff.branchId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account?.provider === "staff-credentials") {
        token.userType = "staff";
        token.staffId = user.id;
        token.role = user.role;
        token.branchId = user.branchId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        userType: token.userType,
        staffId: token.staffId,
        role: token.role,
        branchId: token.branchId,
      } as never;
      return session;
    },
  },
};
