import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname !== "/login" && !pathname.startsWith("/api/auth")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      // Must match authOptions.cookies.sessionToken.name in src/lib/auth.ts —
      // withAuth()'s default getToken() doesn't know about that override, so
      // it never found the cookie and bounced every request back to /login.
      cookieName: "lamunn-finance.session-token",
    });

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
