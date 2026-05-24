import { prisma, setTenantSchema } from "database";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function PUT(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    await prisma.notification.updateMany({
      where: { id: params.id, userId: session.id },
      data: { read: true },
    });

    return success({ read: true });
  } catch (error) {
    return handleApiError(error);
  }
}
