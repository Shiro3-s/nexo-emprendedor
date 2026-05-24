import { prisma, setTenantSchema } from "database";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET() {
  try {
    await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const events = await prisma.event.findMany({
      where: { isActive: true },
      include: { attendees: true },
      orderBy: { startDate: "asc" },
    });

    return success(events);
  } catch (error) {
    return handleApiError(error);
  }
}
