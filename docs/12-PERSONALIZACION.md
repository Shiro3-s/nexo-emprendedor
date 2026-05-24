# 12 — Personalización por Empresa

---

## ¿Qué se Configura por Tenant?

Cada empresa que contrata Nexo Emprendedor obtiene:

| Aspecto | Configurable | Dónde se define |
|---------|-------------|-----------------|
| **Nombre** | ✅ | Tabla `tenants.name` |
| **Subdominio** | ✅ | Tabla `tenants.slug` → `uniminuto.nexoemprendedor.com` |
| **Dominio de email** | ✅ | `tenants.emailDomain` → se valida en registro |
| **Logo** | ✅ | `tenants.logo` → URL del logo |
| **Colores** | ✅ | `tenants.primaryColor`, `tenants.secondaryColor` |
| **Proveedor auth** | ✅ | Azure AD, Google, o solo email/password |
| **Catálogos** | ✅ | Programas, centros, estados civiles, etc. por schema |
| **Formulario diagnóstico** | ✅ | Tablas `DiagnosticSection` + `DiagnosticQuestion` |
| **Módulos activos** | ✅ | `tenants.config.features` (JSON) |
| **Roles** | ✅ | Admin, Asesor, Emprendedor (nombres configurables) |

---

## Ejemplo: Configurar UNIMINUTO

```typescript
// packages/config/tenants/uniminuto.ts
export const uniminutoConfig = {
  name: 'UNIMINUTO',
  slug: 'uniminuto',
  emailDomain: '@uniminuto.edu',
  schemaName: 'uniminuto',
  
  // Branding
  brand: {
    logo: '/img/logo-uniminuto.png',
    colors: {
      primary: '#0057a4',
      secondary: '#ffc400',
      sidebar: '#0c4a6e',
    },
  },

  // Autenticación
  auth: {
    providers: ['azure-ad'], // Solo Azure AD para estudiantes
    azureAd: {
      tenantId: 'uniminuto-tenant-id',
      clientId: 'uniminuto-client-id',
    },
    adminAuth: ['credentials'], // Admins pueden usar email+password
  },

  // Módulos habilitados
  features: {
    academicPrograms: true,
    universityCenters: true,
    populationTypes: true,
    events: true,
    diagnostics: true,
    commitmentLetter: true,
    exports: true,
    bulkUpload: true,
  },

  // Catálogos iniciales
  catalogs: {
    civilStatuses: [
      'Soltero/a', 'Casado/a', 'Divorciado/a',
      'Viudo/a', 'Unión Libre',
    ],
    populationTypes: [
      'Emprendedor', 'Egresado', 'Asesor', 'Administrativo',
    ],
  },
};
```

---

## Ejemplo: Configurar una Cámara de Comercio

```typescript
// packages/config/tenants/camara-comercio.ts
export const camaraComercioConfig = {
  name: 'Cámara de Comercio de Ibagué',
  slug: 'camara-ibague',
  emailDomain: '@ccibague.org',
  schemaName: 'camara_ibague',

  brand: {
    logo: '/img/logo-ccibague.png',
    colors: {
      primary: '#1a5276',
      secondary: '#e74c3c',
      sidebar: '#1a5276',
    },
  },

  auth: {
    providers: ['credentials'], // Solo email+password
  },

  features: {
    academicPrograms: false,   // No tienen programas académicos
    universityCenters: false,   // No tienen centros universitarios
    populationTypes: true,
    events: true,
    diagnostics: true,
    commitmentLetter: true,
    exports: true,
    bulkUpload: true,
  },

  catalogs: {
    civilStatuses: [
      'Soltero/a', 'Casado/a', 'Divorciado/a',
      'Viudo/a', 'Unión Libre',
    ],
    // No tienen programas ni centros académicos
  },
};
```

---

## Flujo para Agregar un Nuevo Cliente

```bash
# 1. Crear schema en PostgreSQL
docker compose exec app node scripts/create-tenant.js \
  --slug=nueva-empresa \
  --name="Nueva Empresa S.A.S." \
  --email-domain="@nuevaempresa.com"

# 2. Configurar DNS
# Registrar CNAME: nueva-empresa.nexoemprendedor.com → IP del servidor

# 3. El admin de la empresa:
#    - Inicia sesión en https://nueva-empresa.nexoemprendedor.com
#    - Configura catálogos desde el panel (programas, centros, etc.)
#    - Sube logo y define colores
#    - Carga usuarios desde CSV
#    - ¡Todo listo!

# Tiempo total: ~30 minutos
```

---

## Script de Creación de Tenant

```typescript
// scripts/create-tenant.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateTenantOptions {
  slug: string;
  name: string;
  emailDomain: string;
}

async function createTenant(options: CreateTenantOptions) {
  const { slug, name, emailDomain } = options;

  console.log(`🚀 Creando tenant: ${name} (${slug})`);

  // 1. Crear schema en PostgreSQL
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${slug}";`);
  console.log(`✅ Schema "${slug}" creado`);

  // 2. Migrar tablas al schema (ejecutar Prisma migrations)
  // En producción, ejecutar: npx prisma migrate deploy
  // Esto crea las tablas en el nuevo schema

  // 3. Registrar tenant
  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      domain: `${slug}.nexoemprendedor.com`,
      emailDomain,
      schemaName: slug,
      primaryColor: '#0057a4',
      secondaryColor: '#ffc400',
      isActive: true,
      config: {
        features: {
          academicPrograms: true,
          universityCenters: true,
          populationTypes: true,
          events: true,
          diagnostics: true,
          commitmentLetter: true,
          exports: true,
          bulkUpload: true,
        },
      },
    },
  });

  // 4. Crear datos iniciales en el schema del tenant
  await prisma.$executeRawUnsafe(`SET search_path TO "${slug}";`);

  // Roles
  await prisma.role.createMany({
    data: [
      { name: 'ADMIN', description: 'Administrador del sistema' },
      { name: 'ASESOR', description: 'Asesor de emprendimientos' },
      { name: 'EMPRENDEDOR', description: 'Emprendedor' },
    ],
  });

  // Tipos de documento
  await prisma.documentType.createMany({
    data: [
      { name: 'CC', description: 'Cédula de Ciudadanía' },
      { name: 'CE', description: 'Cédula de Extranjería' },
      { name: 'Pasaporte', description: 'Pasaporte' },
      { name: 'TI', description: 'Tarjeta de Identidad' },
    ],
  });

  // Estados civiles (configurables)
  await prisma.civilStatus.createMany({
    data: [
      { name: 'Soltero/a' },
      { name: 'Casado/a' },
      { name: 'Divorciado/a' },
      { name: 'Viudo/a' },
      { name: 'Unión Libre' },
    ],
  });

  // Crear admin por defecto
  const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
  await prisma.user.create({
    data: {
      email: `admin@${slug}.com`,
      name: `Admin ${name}`,
      roleId: adminRole!.id,
      validationStage: 'FULLY_VALIDATED',
    },
  });

  console.log(`✅ Tenant ${name} creado exitosamente`);
  console.log(`🌐 Subdominio: https://${slug}.nexoemprendedor.com`);
  console.log(`👤 Admin: admin@${slug}.com`);

  return tenant;
}

// Ejecutar
createTenant({
  slug: process.argv[2] || 'demo',
  name: process.argv[3] || 'Demo Tenant',
  emailDomain: process.argv[4] || '@demo.com',
});
```

---

## Conclusión: ¿Es Sencillo Personalizar?

**Sí.** Con la nueva arquitectura:

### Lo que cambia
- Logo y colores (config en BD)
- Dominio de email (config en BD)
- Catálogos (config en BD)
- Formularios de diagnóstico (config en BD)
- Módulos habilitados (feature flags en BD)

### Lo que NO cambia
- Código fuente (un solo codebase)
- Flujo de validación en 3 etapas
- Sistema de permisos
- Exportación y carga masiva
- Notificaciones
- Auditoría

Para **UNIMINUTO** específicamente:
- Solo se cambia el archivo `packages/config/tenants/uniminuto.ts`
- Se configura Azure AD con el tenant de Microsoft de UNIMINUTO
- Se cargan los programas académicos y centros universitarios
- Se ajustan los colores institucionales (`#0057a4`, `#ffc400`)
- **Todo lo demás funciona igual que para cualquier otra empresa**

> **Tiempo estimado de onboarding para una nueva empresa:**
> Configuración técnica: ~30 minutos
> Carga de datos iniciales (CSV): ~1 hora
> Personalización de formularios: ~2 horas
> **Total: menos de 4 horas** para tener una nueva empresa funcionando.
