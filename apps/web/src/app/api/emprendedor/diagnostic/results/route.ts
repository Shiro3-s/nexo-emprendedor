import { prisma, setTenantSchema } from "database";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success, ApiError } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const session = await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const scores = await prisma.diagnosticScore.findMany({
      where: { userId: session.id },
      include: { dimension: true },
      orderBy: { createdAt: "desc" },
    });

    return success(scores);
  } catch (error) {
    return handleApiError(error);
  }
}
