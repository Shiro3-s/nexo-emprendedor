import { prisma, setTenantSchema, getDashboardData } from "database";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success, ApiError } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await requireAuth(["ASESOR", "ADMIN"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const template = await prisma.diagnosticTemplate.findFirst({ where: { isActive: true } });
    if (!template) throw new ApiError(404, "No hay template activo");

    const dashboard = await getDashboardData(params.userId, template.id);
    return success(dashboard);
  } catch (error) {
    return handleApiError(error);
  }
}
