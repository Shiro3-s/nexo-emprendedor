import { prisma, setTenantSchema } from "database";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success, ApiError } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(["ADMIN"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        role: true,
        entrepreneurship: { include: { advisor: true } },
        validationLogs: { orderBy: { createdAt: "desc" } },
        diagnosticScores: true,
        generatedDocuments: true,
      },
    });

    if (!user) throw new ApiError(404, "Usuario no encontrado");
    return success(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(["ADMIN"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const data = await req.json();
    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      include: { role: true },
    });

    return success(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(["ADMIN"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    await prisma.user.update({
      where: { id: params.id },
      data: { validationStage: "REJECTED" },
    });

    return success({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
