import { prisma, setTenantSchema, calculateScores } from "database";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success, ApiError } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function POST() {
  try {
    const session = await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const template = await prisma.diagnosticTemplate.findFirst({ where: { isActive: true } });
    if (!template) throw new ApiError(404, "No hay template activo");

    // Marcar diagnóstico como completado
    const user = await prisma.user.update({
      where: { id: session.id },
      data: { validationStage: "DIAGNOSTICS_DONE" },
    });

    // Calcular scores
    const scores = await calculateScores(session.id, template.id);

    // Guardar scores
    for (const score of scores) {
      await prisma.diagnosticScore.upsert({
        where: {
          userId_dimensionId_templateId: {
            userId: session.id,
            dimensionId: score.dimensionId,
            templateId: template.id,
          },
        },
        update: {
          rawScore: score.rawScore,
          maxScore: score.maxScore,
          percentage: score.percentage,
          level: score.level,
        },
        create: {
          userId: session.id,
          dimensionId: score.dimensionId,
          templateId: template.id,
          rawScore: score.rawScore,
          maxScore: score.maxScore,
          percentage: score.percentage,
          level: score.level,
        },
      });
    }

    // Notificar admins
    const admins = await prisma.user.findMany({
      where: { role: { name: "ADMIN" } },
    });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: "Diagnóstico completado",
          message: `${user.name} ha completado el diagnóstico. Revisa los resultados.`,
          type: "info",
          link: `/admin/usuarios/${user.id}`,
        },
      });
    }

    return success({
      stage: "DIAGNOSTICS_DONE",
      scores,
      message: "Diagnóstico completado. Espera la verificación del administrador.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
