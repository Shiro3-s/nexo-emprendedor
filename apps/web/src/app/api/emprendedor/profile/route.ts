import { prisma, setTenantSchema } from "database";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success, ApiError } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const session = await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        role: true,
        academicProgram: true,
        universityCenter: true,
        entrepreneurship: true,
      },
    });

    if (!user) throw new ApiError(404, "Usuario no encontrado");
    return success(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const data = await req.json();

    const profileFields = [
      "name", "documentType", "documentNumber", "phone", "address",
      "birthDate", "gender", "maritalStatus", "semester", "modality",
      "academicProgramId", "universityCenterId",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of profileFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (data.birthDate) updateData.birthDate = new Date(data.birthDate);

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) throw new ApiError(404, "Usuario no encontrado");

    const wasPending = user.validationStage === "PENDING_PROFILE";
    if (wasPending) updateData.validationStage = "PROFILE_COMPLETED";

    const updated = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
    });

    if (wasPending) {
      const admins = await prisma.user.findMany({
        where: { role: { name: "ADMIN" } },
      });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: "Perfil completado",
            message: `${updated.name} ha completado su perfil y espera asesoría de bienvenida.`,
            type: "info",
            link: `/admin/usuarios/${updated.id}`,
          },
        });
      }
    }

    return success(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
