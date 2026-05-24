import { prisma, setTenantSchema } from "database";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success, ApiError } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await requireAuth(["ADMIN"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const responses = await prisma.diagnosticResponse.findMany({
      where: { userId: params.userId },
      include: {
        question: {
          include: {
            section: { select: { title: true } },
            scoringRules: { include: { dimension: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!responses.length) throw new ApiError(404, "No hay respuestas de diagnóstico para este usuario");

    return success(responses);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await requireAuth(["ADMIN"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const body = await req.json();

    if (body.action === "verify") {
      const user = await prisma.user.findUnique({ where: { id: params.userId } });
      if (!user) throw new ApiError(404, "Usuario no encontrado");

      const nextStage = user.validationStage === "DIAGNOSTICS_DONE" ? "LETTER_ACCESS" : user.validationStage;

      await prisma.user.update({
        where: { id: params.userId },
        data: { validationStage: nextStage },
      });

      await prisma.validationLog.create({
        data: {
          userId: params.userId,
          fromStage: user.validationStage,
          toStage: nextStage,
          changedBy: admin.id,
          comment: body.comment || "Diagnóstico verificado por admin",
        },
      });

      return success({ stage: nextStage });
    }

    return success(null);
  } catch (error) {
    return handleApiError(error);
  }
}
