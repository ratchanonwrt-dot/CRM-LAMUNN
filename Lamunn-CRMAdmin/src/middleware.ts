import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Everything under /admin (except /admin/login) requires a staff session.
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      if (!token || token.userType !== "staff") {
        const loginUrl = new URL("/admin/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // We handle all the real authorization logic above; always let the request
      // through to the function so we can redirect to /admin/login with the right
      // callbackUrl instead of NextAuth's default.
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};
