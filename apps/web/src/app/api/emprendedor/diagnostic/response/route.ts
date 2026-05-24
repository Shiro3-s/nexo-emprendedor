import { prisma, setTenantSchema } from "database";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success, ApiError } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const { questionId, value } = await req.json();
    if (!questionId || value === undefined) {
      throw new ApiError(400, "questionId y value son requeridos");
    }

    const template = await prisma.diagnosticTemplate.findFirst({ where: { isActive: true } });
    if (!template) throw new ApiError(404, "No hay template activo");

    const question = await prisma.diagnosticQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new ApiError(404, "Pregunta no encontrada");

    const response = await prisma.diagnosticResponse.upsert({
      where: {
        userId_questionId: { userId: session.id, questionId },
      },
      update: { value, templateId: template.id },
      create: {
        userId: session.id,
        questionId,
        templateId: template.id,
        value,
      },
    });

    return success(response);
  } catch (error) {
    return handleApiError(error);
  }
}
