import { prisma, setTenantSchema } from "database";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success, ApiError } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

const STAGE_FLOW: Record<string, string> = {
  PROFILE_COMPLETED: "DIAGNOSTICS_ACCESS",
  DIAGNOSTICS_DONE: "LETTER_ACCESS",
  LETTER_UPLOADED: "FULLY_VALIDATED",
};

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAuth(["ADMIN"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const { userId, action, comment } = await req.json();

    if (action === "reject") {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new ApiError(404, "Usuario no encontrado");

      await prisma.validationLog.create({
        data: {
          userId,
          fromStage: user.validationStage as never,
          toStage: (user.validationStage === "DIAGNOSTICS_DONE" ? "DIAGNOSTICS_ACCESS" : "REJECTED") as never,
          changedBy: admin.id,
          comment,
        },
      });

      const rollbackStage = user.validationStage === "DIAGNOSTICS_DONE" ? "DIAGNOSTICS_ACCESS" : "LETTER_ACCESS";
      await prisma.user.update({
        where: { id: userId },
        data: { validationStage: rollbackStage as never },
      });

      return success({ stage: rollbackStage });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, "Usuario no encontrado");

    const nextStage = STAGE_FLOW[user.validationStage];
    if (!nextStage) throw new ApiError(400, "No hay siguiente etapa disponible");

    await prisma.user.update({
      where: { id: userId },
      data: { validationStage: nextStage as never },
    });

    await prisma.validationLog.create({
      data: {
        userId,
        fromStage: user.validationStage as never,
        toStage: nextStage as never,
        changedBy: admin.id,
        comment,
      },
    });

    return success({ stage: nextStage });
  } catch (error) {
    return handleApiError(error);
  }
}
