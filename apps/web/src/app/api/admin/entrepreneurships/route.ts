import { prisma, setTenantSchema } from "database";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(["ADMIN"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");
    const stage = searchParams.get("stage");

    const where: Record<string, unknown> = {};
    if (stage) where.stage = stage;

    const [items, total] = await Promise.all([
      prisma.entrepreneurship.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.entrepreneurship.count({ where }),
    ]);

    return success(items, { page, pageSize, total });
  } catch (error) {
    return handleApiError(error);
  }
}
