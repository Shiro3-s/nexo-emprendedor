import { headers } from "next/headers";
import { prisma, setTenantSchema, withTenant } from "database";

export { setTenantSchema, withTenant };

export async function getTenantFromRequest() {
  const headersList = await headers();
  const slug = headersList.get("x-tenant-slug");
  if (!slug) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  return tenant;
}

export async function requireTenant() {
  const tenant = await getTenantFromRequest();
  if (!tenant) throw new Error("Tenant no encontrado");
  return tenant;
}
