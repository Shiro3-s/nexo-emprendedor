const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SCHEMA_REGEX = /^[a-z][a-z0-9_]{0,62}$/;

function validateSlug(slug) {
  if (!slug || typeof slug !== "string") {
    throw new Error("El slug es requerido y debe ser un texto.");
  }
  if (!SCHEMA_REGEX.test(slug)) {
    throw new Error(
      `Slug inválido: "${slug}". Solo se permiten minúsculas, números y guiones bajos (máx 63 caracteres).`
    );
  }
}

async function createTenant(slug, name, emailDomain) {
  validateSlug(slug);

  console.log(`Creando tenant: ${name} (${slug})...`);

  // 1. Crear schema en PostgreSQL (slug ya validado)
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${slug}";`);
  console.log(`  ✓ Schema "${slug}" creado.`);

  // 2. Clonar estructura desde el schema "tenants"
  //    Usamos format() de PostgreSQL con %I que escapa identificadores automáticamente
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE
      t text;
    BEGIN
      FOR t IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'tenants'
          AND table_type = 'BASE TABLE'
      LOOP
        EXECUTE format(
          'CREATE TABLE IF NOT EXISTS %I.%I (LIKE "tenants".%I INCLUDING ALL)',
          '${slug}', t, t
        );
        EXECUTE format(
          'CREATE SEQUENCE IF NOT EXISTS %I.%I_id_seq',
          '${slug}', t
        );
      END LOOP;
    END $$;
  `);
  console.log(`  ✓ Estructura clonada desde "tenants".`);

  // 3. Crear roles por defecto en el nuevo schema (slug validado)
  await prisma.$executeRawUnsafe(`SET search_path TO "${slug}";`);

  const roles = ["ADMIN", "ASESOR", "EMPRENDEDOR"];
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: {
        name: role,
        description:
          role === "ADMIN"
            ? "Administrador del sistema"
            : role === "ASESOR"
              ? "Asesor de emprendedores"
              : "Emprendedor acompañado",
      },
    });
  }
  console.log(`  ✓ Roles por defecto creados.`);

  // 4. Registrar el tenant en el schema public
  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      domain: `${slug}.nexoemprendedor.com`,
      emailDomain,
      schemaName: slug,
      primaryColor: "#0057a4",
      secondaryColor: "#ffc400",
    },
  });
  console.log(`  ✓ Tenant registrado en schema public.`);

  console.log(`\n✅ Tenant "${name}" creado exitosamente:`);
  console.log(`   ID:        ${tenant.id}`);
  console.log(`   Schema:    ${slug}`);
  console.log(`   Dominio:   ${slug}.nexoemprendedor.com`);
  console.log(`   Email:     *@${emailDomain}`);

  return tenant;
}

// CLI
const [_, __, slug, name, emailDomain] = process.argv;

if (!slug || !name || !emailDomain) {
  console.log("Uso: node scripts/create-tenant.js <slug> <nombre> <email-domain>");
  console.log("Ejemplo: node scripts/create-tenant.js uniminuto UNIMINUTO @uniminuto.edu");
  process.exit(1);
}

createTenant(slug, name, emailDomain)
  .catch((e) => {
    console.error("Error creando tenant:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
