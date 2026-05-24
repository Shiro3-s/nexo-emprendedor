import { prisma, setTenantSchema } from "database";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success, ApiError } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET(
  _req: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const questions = await prisma.diagnosticQuestion.findMany({
      where: { sectionId: params.sectionId, isActive: true },
      include: {
        responses: { take: 0 },
      },
      orderBy: { order: "asc" },
    });

    return success(questions);
  } catch (error) {
    return handleApiError(error);
  }
}
