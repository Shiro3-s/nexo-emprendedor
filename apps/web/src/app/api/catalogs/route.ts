import { prisma, setTenantSchema } from "database";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { handleApiError, success } from "@/lib/api-error";
import { requireTenant } from "@/lib/tenant";

const CATALOG_MAP: Record<string, () => Promise<unknown[]>> = {
  "document-types": async () => [
    { value: "CC", label: "Cédula de Ciudadanía" },
    { value: "CE", label: "Cédula de Extranjería" },
    { value: "Pasaporte", label: "Pasaporte" },
    { value: "TI", label: "Tarjeta de Identidad" },
  ],
  "civil-status": async () => {
    const items = await prisma.civilStatus.findMany({ where: { isActive: true } });
    return items.map((s) => ({ value: s.id, label: s.name }));
  },
  "academic-programs": async () => {
    const items = await prisma.academicProgram.findMany({ where: { isActive: true } });
    return items.map((p) => ({ value: p.id, label: p.name }));
  },
  "uni-centers": async () => {
    const items = await prisma.universityCenter.findMany({ where: { isActive: true } });
    return items.map((c) => ({ value: c.id, label: c.name, location: c.location }));
  },
  "economic-sectors": async () => [
    { value: "Agropecuario", label: "Agropecuario" },
    { value: "Pecuario", label: "Pecuario" },
    { value: "Industrial", label: "Industrial" },
    { value: "Comercio", label: "Comercio" },
    { value: "Servicios", label: "Servicios" },
    { value: "Tecnología", label: "Tecnología" },
    { value: "Cultural", label: "Cultural" },
    { value: "Otro", label: "Otro" },
  ],
  "entrepreneurship-stages": async () => [
    { value: "IDEACION", label: "Ideación" },
    { value: "PROTOTIPADO", label: "Prototipado" },
    { value: "VALIDACION", label: "Validación" },
    { value: "LANZAMIENTO", label: "Lanzamiento" },
  ],
  "population-types": async () => [
    { value: "SI", label: "Sí" },
    { value: "NO", label: "No" },
  ],
  "event-types": async () => [
    { value: "Taller", label: "Taller" },
    { value: "Masterclass", label: "Masterclass" },
    { value: "Seminario", label: "Seminario" },
    { value: "Charla", label: "Charla" },
  ],
};

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const tenant = await requireTenant();
    await setTenantSchema(tenant.schemaName);

    const type = req.nextUrl.searchParams.get("type");
    const catalogName = req.nextUrl.pathname.split("/").pop() || type || "";

    if (catalogName && CATALOG_MAP[catalogName]) {
      const data = await CATALOG_MAP[catalogName]();
      return success(data);
    }

    const catalogs = Object.keys(CATALOG_MAP);
    return success(catalogs);
  } catch (error) {
    return handleApiError(error);
  }
}
