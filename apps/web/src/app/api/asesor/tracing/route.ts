import { prisma, setTenantSchema } from "database";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(["ASESOR"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const { searchParams } = new URL(req.url);
    const entrepreneurshipId = searchParams.get("entrepreneurshipId");

    const where: Record<string, unknown> = { advisorId: session.id };
    if (entrepreneurshipId) where.entrepreneurshipId = entrepreneurshipId;

    const tracings = await prisma.advisorAssignment.findMany({
      where,
      include: {
        entrepreneurship: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    return success(tracings);
  } catch (error) {
    return handleApiError(error);
  }
}
