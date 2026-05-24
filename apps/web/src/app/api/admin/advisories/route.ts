import { prisma, setTenantSchema } from "database";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success, ApiError } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(["ADMIN"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const status = req.nextUrl.searchParams.get("status");
    const isPending = req.nextUrl.pathname.includes("pending");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (isPending) where.status = "PENDING";

    const advisories = await prisma.advisoryRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        advisories: { include: { request: false } },
      },
      orderBy: { createdAt: "desc" },
    });

    return success(advisories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(["ADMIN"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const { requestId, advisorId, modality, scheduledDate, location, virtualLink } = await req.json();
    if (!requestId || !advisorId) throw new ApiError(400, "requestId y advisorId son requeridos");

    const advisory = await prisma.advisory.create({
      data: {
        requestId,
        advisorId,
        modality: modality || "VIRTUAL",
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        location,
        virtualLink,
      },
    });

    await prisma.advisoryRequest.update({
      where: { id: requestId },
      data: { status: "SCHEDULED" },
    });

    return success(advisory);
  } catch (error) {
    return handleApiError(error);
  }
}
