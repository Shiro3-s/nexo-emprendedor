import { prisma, setTenantSchema } from "database";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success, ApiError } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const { reason } = await req.json();
    if (!reason) throw new ApiError(400, "El motivo de la asesoría es requerido");

    const advisory = await prisma.advisoryRequest.create({
      data: { userId: session.id, reason },
    });

    const admins = await prisma.user.findMany({
      where: { role: { name: "ADMIN" } },
    });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: "Nueva solicitud de asesoría",
          message: "Un emprendedor ha solicitado una asesoría.",
          type: "info",
          link: `/admin/advisories`,
        },
      });
    }

    return success(advisory);
  } catch (error) {
    return handleApiError(error);
  }
}
