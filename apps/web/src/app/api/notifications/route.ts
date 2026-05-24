import { prisma, setTenantSchema } from "database";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const where: Record<string, unknown> = { userId: session.id };
    if (unreadOnly) where.read = false;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({ where: { userId: session.id, read: false } }),
    ]);

    if (unreadOnly) return success({ count: notifications.length });
    return success(notifications, { unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const body = await req.json();
    if (body.readAll) {
      await prisma.notification.updateMany({
        where: { userId: session.id, read: false },
        data: { read: true },
      });
      return success({ updated: true });
    }

    return success(null);
  } catch (error) {
    return handleApiError(error);
  }
}
