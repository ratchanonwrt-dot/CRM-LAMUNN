import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // These routes all read session.user.customerId directly without checking
    // for null, so an unauthenticated request must never reach the page component.
    const protectedPaths = ["/dashboard", "/rewards", "/history", "/coupons"];
    if (protectedPaths.some((p) => pathname.startsWith(p)) && token?.userType !== "customer") {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // We handle all the real authorization logic above; always let the request
      // through to the function so we can redirect to /login with the right callbackUrl.
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/rewards/:path*", "/history/:path*", "/coupons/:path*"],
};
