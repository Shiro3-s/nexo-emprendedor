import { NextRequest } from "next/server";
import { calculateScores } from "database";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success, ApiError } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";
import { setTenantSchema } from "@/lib/tenant";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await requireAuth(["ADMIN"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const template = await prisma.diagnosticTemplate.findFirst({ where: { isActive: true } });
    if (!template) throw new ApiError(404, "No hay template activo de diagnóstico");

    const scores = await calculateScores(params.userId, template.id);
    return success(scores);
  } catch (error) {
    return handleApiError(error);
  }
}
