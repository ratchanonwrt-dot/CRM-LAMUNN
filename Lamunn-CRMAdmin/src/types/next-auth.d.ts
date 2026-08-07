import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      userType?: "customer" | "staff";
      customerId?: string;
      staffId?: string;
      role?: "SUPER_ADMIN" | "SUPERVISOR" | "STAFF" | "MARKETING";
      branchId?: string | null;
    };
  }

  // Extra fields returned by the staff-credentials authorize() callback so the
  // jwt() callback in src/lib/auth.ts can read them without a type cast.
  interface User {
    role?: "SUPER_ADMIN" | "SUPERVISOR" | "STAFF" | "MARKETING";
    branchId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userType?: "customer" | "staff";
    customerId?: string;
    staffId?: string;
    role?: "SUPER_ADMIN" | "SUPERVISOR" | "STAFF" | "MARKETING";
    branchId?: string | null;
  }
}
