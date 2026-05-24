import { prisma, setTenantSchema } from "database";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success, ApiError } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";
import { hashPassword } from "@/lib/password";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(["ADMIN"]);
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");
    const role = searchParams.get("role");
    const stage = searchParams.get("stage");

    const where: Record<string, unknown> = {};
    if (role) where.role = { name: role };
    if (stage) where.validationStage = stage;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { role: true, entrepreneurship: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return success(users, { page, pageSize, total });
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
    const { email, name, roleName, password } = data;

    const role = await prisma.role.findUnique({ where: { name: roleName || "EMPRENDEDOR" } });
    if (!role) throw new ApiError(400, "Rol no válido");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, "El email ya está registrado");

    const passwordHash = password ? await hashPassword(password) : undefined;

    const user = await prisma.user.create({
      data: { email, name, roleId: role.id, passwordHash },
      include: { role: true },
    });

    return success(user);
  } catch (error) {
    return handleApiError(error);
  }
}
