import { prisma, setTenantSchema } from "database";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET() {
  try {
    await requireAuth(["ADMIN"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const diagnostics = await prisma.diagnosticResponse.findMany({
      where: { template: { isActive: true } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        question: { select: { question: true, type: true } },
      },
      distinct: ["userId"],
      orderBy: { createdAt: "desc" },
    });

    return success(diagnostics);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(["ADMIN"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const data = await req.json();

    if (data.action === "create-template") {
      const template = await prisma.diagnosticTemplate.create({
        data: {
          name: data.name,
          description: data.description,
          scoringValues: data.scoringValues,
          scoringLevels: data.scoringLevels,
        },
      });
      return success(template);
    }

    return success(null);
  } catch (error) {
    return handleApiError(error);
  }
}
