import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { ApiError } from "./api-error";

type Role = "ADMIN" | "ASESOR" | "EMPRENDEDOR";

export async function requireAuth(allowedRoles?: Role[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new ApiError(401, "No autenticado");
  }

  const user = session.user as {
    id: string;
    role: Role;
    tenantSlug: string;
  };

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new ApiError(403, "No tienes permisos para acceder a este recurso");
  }

  return user;
}

export async function getOptionalSession() {
  return getServerSession(authOptions);
}
