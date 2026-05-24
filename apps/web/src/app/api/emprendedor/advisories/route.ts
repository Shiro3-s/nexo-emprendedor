import { prisma, setTenantSchema } from "database";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const session = await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const advisories = await prisma.advisoryRequest.findMany({
      where: { userId: session.id },
      include: { advisories: true },
      orderBy: { createdAt: "desc" },
    });

    return success(advisories);
  } catch (error) {
    return handleApiError(error);
  }
}
