import { prisma, setTenantSchema } from "database";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success, ApiError } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: { attendees: { include: { event: false } } },
    });

    if (!event) throw new ApiError(404, "Evento no encontrado");
    return success(event);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) throw new ApiError(404, "Evento no encontrado");

    const existing = await prisma.eventAttendee.findUnique({
      where: { eventId_userId: { eventId: params.id, userId: session.id } },
    });
    if (existing) throw new ApiError(409, "Ya estás registrado en este evento");

    if (event.maxAttendees) {
      const count = await prisma.eventAttendee.count({
        where: { eventId: params.id, status: "confirmed" },
      });
      if (count >= event.maxAttendees) {
        throw new ApiError(400, "El evento ha alcanzado el máximo de asistentes");
      }
    }

    const attendee = await prisma.eventAttendee.create({
      data: { eventId: params.id, userId: session.id, status: "confirmed" },
    });

    return success(attendee);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    await prisma.eventAttendee.delete({
      where: { eventId_userId: { eventId: params.id, userId: session.id } },
    });

    return success({ unregistered: true });
  } catch (error) {
    return handleApiError(error);
  }
}
