import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      staffId?: string;
      role?: "ADMIN" | "STAFF";
    };
  }

  interface User {
    role?: "ADMIN" | "STAFF";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    staffId?: string;
    role?: "ADMIN" | "STAFF";
  }
}
