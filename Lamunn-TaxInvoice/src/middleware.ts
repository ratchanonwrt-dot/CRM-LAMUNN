import { NextRequest, NextResponse } from "next/server";

// Guards /admin with HTTP Basic Auth. ADMIN_PASSWORD must be set in .env; the
// username is fixed since this is a single shared internal password, not per-user
// accounts.
export function middleware(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!adminPassword) {
    return new NextResponse("ADMIN_PASSWORD is not configured", { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      const [, password] = Buffer.from(encoded, "base64").toString().split(":");
      if (password === adminPassword) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="admin"' },
  });
}

export const config = {
  matcher: "/admin/:path*",
};
