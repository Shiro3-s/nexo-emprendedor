import { prisma, setTenantSchema } from "database";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const session = await requireAuth(["ASESOR"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const advisories = await prisma.advisory.findMany({
      where: { advisorId: session.id },
      include: {
        request: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { scheduledDate: "desc" },
    });

    return success(advisories);
  } catch (error) {
    return handleApiError(error);
  }
}
