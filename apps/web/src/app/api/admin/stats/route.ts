import { prisma, setTenantSchema } from "database";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET() {
  try {
    await requireAuth(["ADMIN"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const [
      totalUsers,
      usersByStage,
      usersByRole,
      totalEntrepreneurships,
      totalAdvisories,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ["validationStage"], _count: true }),
      prisma.user.groupBy({ by: ["roleId"], _count: true }),
      prisma.entrepreneurship.count(),
      prisma.advisoryRequest.count(),
    ]);

    const roles = await prisma.role.findMany();
    const roleMap = Object.fromEntries(roles.map((r) => [r.id, r.name]));

    return success({
      totalUsers,
      usersByStage: Object.fromEntries(usersByStage.map((s) => [s.validationStage, s._count])),
      usersByRole: Object.fromEntries(usersByRole.map((r) => [roleMap[r.roleId] || r.roleId, r._count])),
      totalEntrepreneurships,
      totalAdvisories,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
