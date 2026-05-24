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
      select: { commitmentLetter: true, commitmentLetterUploadedAt: true },
    });

    return success(entrepreneurship);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) throw new ApiError(400, "Archivo requerido");

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `compromiso-${session.id}-${Date.now()}.pdf`;

    // En producción, subir a S3/Uploadthing. Por ahora guardamos local.
    const fs = await import("fs/promises");
    const path = await import("path");
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, fileName), buffer);

    const url = `/uploads/${fileName}`;

    await prisma.entrepreneurship.update({
      where: { userId: session.id },
      data: { commitmentLetter: url, commitmentLetterUploadedAt: new Date() },
    });

    await prisma.user.update({
      where: { id: session.id },
      data: { validationStage: "LETTER_UPLOADED" },
    });

    const admins = await prisma.user.findMany({
      where: { role: { name: "ADMIN" } },
    });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: "Carta de compromiso subida",
          message: "Un emprendedor ha subido su carta de compromiso firmada.",
          type: "info",
          link: `/admin/usuarios/${session.id}`,
        },
      });
    }

    return success({ url, stage: "LETTER_UPLOADED" });
  } catch (error) {
    return handleApiError(error);
  }
}
