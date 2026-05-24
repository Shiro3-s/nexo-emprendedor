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

    const entrepreneurship = await prisma.entrepreneurship.findUnique({
      where: { userId: session.id },
      include: { advisor: true },
    });

    return success(entrepreneurship);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(["EMPRENDEDOR"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user || user.validationStage === "PENDING_PROFILE" || user.validationStage === "PROFILE_COMPLETED") {
      throw new ApiError(403, "Debes completar la validación de perfil antes de crear un emprendimiento");
    }

    const existing = await prisma.entrepreneurship.findUnique({
      where: { userId: session.id },
    });
    if (existing) throw new ApiError(409, "Ya tienes un emprendimiento registrado");

    const data = await req.json();
    const entrepreneurship = await prisma.entrepreneurship.create({
      data: {
        userId: session.id,
        name: data.name,
        description: data.description,
        economicSector: data.economicSector,
        businessModel: data.businessModel,
      },
    });

    return success(entrepreneurship);
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
    const entrepreneurship = await prisma.entrepreneurship.update({
      where: { userId: session.id },
      data: {
        name: data.name,
        description: data.description,
        stage: data.stage,
        economicSector: data.economicSector,
        businessModel: data.businessModel,
      },
    });

    return success(entrepreneurship);
  } catch (error) {
    return handleApiError(error);
  }
}
