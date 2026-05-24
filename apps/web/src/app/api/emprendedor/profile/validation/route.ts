import { prisma, setTenantSchema } from "database";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success, ApiError } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const session = await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { validationStage: true },
    });

    if (!user) throw new ApiError(404, "Usuario no encontrado");
    return success(user);
  } catch (error) {
    return handleApiError(error);
  }
}
