import { prisma, setTenantSchema } from "database";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const session = await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const documents = await prisma.generatedDocument.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });

    return success(documents);
  } catch (error) {
    return handleApiError(error);
  }
}
