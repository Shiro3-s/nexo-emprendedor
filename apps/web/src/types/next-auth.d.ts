import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      tenantSlug: string;
      image?: string | null;
    };
  }

  interface User {
    role?: string;
    tenantSlug?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    tenantSlug: string;
  }
}
