import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // /dashboard and /rewards require a customer session.
    if ((pathname.startsWith("/dashboard") || pathname.startsWith("/rewards")) && token?.userType !== "customer") {
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
  matcher: ["/dashboard/:path*", "/rewards/:path*"],
};
