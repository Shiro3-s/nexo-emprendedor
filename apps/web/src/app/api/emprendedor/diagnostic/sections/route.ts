import { prisma, setTenantSchema } from "database";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success, ApiError } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET() {
  try {
    await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const template = await prisma.diagnosticTemplate.findFirst({
      where: { isActive: true },
      include: {
        sections: {
          include: { questions: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!template) throw new ApiError(404, "No hay un diagnóstico activo configurado");
    return success(template);
  } catch (error) {
    return handleApiError(error);
  }
}
