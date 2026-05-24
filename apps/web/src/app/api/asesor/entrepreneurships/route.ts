import { prisma, setTenantSchema } from "database";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const session = await requireAuth(["ASESOR"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const assignments = await prisma.advisorAssignment.findMany({
      where: { advisorId: session.id, isActive: true },
      include: {
        entrepreneurship: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    const entrepreneurships = assignments.map((a) => a.entrepreneurship);
    return success(entrepreneurships);
  } catch (error) {
    return handleApiError(error);
  }
}
