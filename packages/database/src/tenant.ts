import { prisma } from "./client";

export type TenantInfo = {
  id: string;
  slug: string;
  schemaName: string;
  name: string;
  domain: string;
  emailDomain: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
  config: unknown;
};

const SCHEMA_REGEX = /^[a-z][a-z0-9_]{0,62}$/;
const SLUG_REGEX = /^[a-z][a-z0-9-]{0,62}$/;

function validateSchemaName(schemaName: string): void {
  if (!SCHEMA_REGEX.test(schemaName)) {
    throw new Error(
      `Schema name inválido: "${schemaName}". Solo se permiten minúsculas, números y guiones bajos (máx 63 caracteres).`
    );
  }
}

function validateSlug(slug: string): void {
  if (!SLUG_REGEX.test(slug)) {
    throw new Error(
      `Slug inválido: "${slug}". Solo se permiten minúsculas, números y guiones (máx 63 caracteres).`
    );
  }
}

export async function getTenantBySlug(slug: string): Promise<TenantInfo | null> {
  validateSlug(slug);
  return prisma.tenant.findUnique({
    where: { slug },
  });
}

export async function getTenantByDomain(domain: string): Promise<TenantInfo | null> {
  return prisma.tenant.findUnique({
    where: { domain },
  });
}

/**
 * Cambia el search_path al schema del tenant.
 * El schemaName se valida con regex estricto antes de usarlo en raw SQL.
 */
export async function setTenantSchema(schemaName: string): Promise<void> {
  validateSchemaName(schemaName);
  await prisma.$executeRawUnsafe(
    `SET search_path TO "${schemaName}", "tenants", public;`
  );
}

/**
 * Ejecuta una función dentro del contexto del schema del tenant.
 * El schemaName se valida con regex estricto antes de usarlo en raw SQL.
 */
export async function withTenant<T>(
  schemaName: string,
  fn: () => Promise<T>
): Promise<T> {
  validateSchemaName(schemaName);
  await prisma.$executeRawUnsafe(
    `SET search_path TO "${schemaName}", "tenants", public;`
  );
  return fn();
}
