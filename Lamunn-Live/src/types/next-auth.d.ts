import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      staffId?: string;
      role?: "SUPER_ADMIN" | "MANAGER" | "STAFF";
    };
  }

  interface User {
    role?: "SUPER_ADMIN" | "MANAGER" | "STAFF";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    staffId?: string;
    role?: "SUPER_ADMIN" | "MANAGER" | "STAFF";
  }
}
