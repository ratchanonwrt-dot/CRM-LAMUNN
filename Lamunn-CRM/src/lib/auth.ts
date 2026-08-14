import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma, grantWelcomeCouponIfNeeded } from "@lamunn/db";
import { verifyOtp } from "@/lib/otp";

const lineLoginConfigured = Boolean(process.env.LINE_CHANNEL_ID && process.env.LINE_CHANNEL_SECRET);

/**
 * Customer-only auth (LINE Login + phone/OTP). Staff/admin auth lives in the
 * separate Lamunn-CRMAdmin app — the two apps no longer share a NextAuth instance
 * or session, since they're different origins now.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    // LINE Login (OAuth2) — only registered once LINE_CHANNEL_ID/SECRET are set,
    // so NextAuth never sees an OAuth provider with an empty clientId. See .env.example.
    ...(lineLoginConfigured
      ? [
          {
            id: "line",
            name: "LINE",
            type: "oauth" as const,
            authorization: {
              url: "https://access.line.me/oauth2/v2.1/authorize",
              params: { scope: "profile openid email", response_type: "code" },
            },
            token: "https://api.line.me/oauth2/v2.1/token",
            userinfo: "https://api.line.me/v2/profile",
            clientId: process.env.LINE_CHANNEL_ID,
            clientSecret: process.env.LINE_CHANNEL_SECRET,
            profile(profile: { userId: string; displayName: string; pictureUrl?: string }) {
              return {
                id: profile.userId,
                name: profile.displayName,
                image: profile.pictureUrl,
              };
            },
          },
        ]
      : []),

    // Customer login via phone + OTP. The OTP itself is requested through
    // POST /api/auth/otp/request beforehand; this just verifies the code.
    CredentialsProvider({
      id: "customer-otp",
      name: "เบอร์โทรศัพท์ (OTP)",
      credentials: {
        phone: { label: "เบอร์โทรศัพท์", type: "text" },
        code: { label: "รหัส OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) return null;
        const result = await verifyOtp(credentials.phone, credentials.code);
        if (!result.ok) return null;

        const customer = await prisma.customer.upsert({
          where: { phone: credentials.phone },
          update: {},
          create: { phone: credentials.phone },
        });

        return { id: customer.id, name: customer.name ?? credentials.phone };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account?.provider === "line") {
        // First LINE sign-in: find or create the Customer by LINE user id.
        const customer = await prisma.customer.upsert({
          where: { lineUserId: user.id },
          update: { name: user.name ?? undefined },
          create: { lineUserId: user.id, name: user.name ?? undefined },
        });
        token.userType = "customer";
        token.customerId = customer.id;
        await grantWelcomeCouponIfNeeded(customer.id);
      } else if (user && account?.provider === "customer-otp") {
        token.userType = "customer";
        token.customerId = user.id;
        await grantWelcomeCouponIfNeeded(user.id);
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        userType: token.userType,
        customerId: token.customerId,
      } as never;
      return session;
    },
  },
};
