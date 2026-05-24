# 03 — Arquitectura Multi-Tenant

---

## Estrategia: Schema-based Isolation con Subdominios

Cada empresa (tenant) tiene:
- **Su propio subdominio** → `uniminuto.nexoemprendedor.com`
- **Su propio schema en PostgreSQL** → `uniminuto` (aislamiento completo de datos)
- **Su propia configuración** → colores, logo, dominios de email, módulos activos

```
nexoemprendedor.com
├── uniminuto.nexoemprendedor.com   → Schema: uniminuto
│   └── dominio email: @uniminuto.edu
├── camara.nexoemprendedor.com      → Schema: camara_comercio
│   └── dominio email: @camara.com
└── incubadora.nexoemprendedor.com  → Schema: incubadora_x
    └── dominio email: @incubadora.org
```

---

## Flujo de una Solicitud

```
1. USUARIO VISITA
   uniminuto.nexoemprendedor.com
          │
          ▼
2. NEXT.JS MIDDLEWARE (middleware.ts)
   - Extrae subdominio: "uniminuto"
   - Busca tenant en BD (schema public)
   - Si no existe → 404
   - Si existe → adjunta tenant a request
          │
          ▼
3. SERVER COMPONENT / API ROUTE
   - Lee tenant de headers/request
   - Prisma: SET search_path TO "${tenant.schemaName}"
   - Todas las queries van al schema correcto
          │
          ▼
4. RESPUESTA
   - Layout con colores del tenant
   - Logo del tenant
   - Datos del tenant
```

---

## Middleware de Detección de Tenant

```typescript
// apps/web/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_DOMAIN = 'nexoemprendedor.com';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Extraer subdominio
  const hostParts = hostname.split('.');
  const isSubdomain = hostParts.length > 2;
  
  if (isSubdomain) {
    const slug = hostParts[0]; // "uniminuto"
    
    // Redirigir a /dashboard si va a la raíz
    if (url.pathname === '/') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    
    // Adjuntar slug del tenant a los headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-slug', slug);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // Dominio principal → landing page
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|static|img|favicon.ico).*)'],
};
```

---

## Helper de Tenant

```typescript
// apps/web/src/lib/tenant.ts
import { prisma } from './db';
import { headers } from 'next/headers';

export async function getTenant() {
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug');
  
  if (!slug) return null;
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });
  
  return tenant;
}

export function getTenantSchemaName(tenant: { schemaName: string }) {
  return tenant.schemaName;
}

// Ejecutar query en el schema del tenant
export async function withTenant<T>(
  tenant: { schemaName: string },
  fn: () => Promise<T>
): Promise<T> {
  await prisma.$executeRawUnsafe(
    `SET search_path TO "${tenant.schemaName}", public;`
  );
  return fn();
}
```

---

## Estructura de Schemas en PostgreSQL

```sql
-- Schema global (público)
CREATE SCHEMA IF NOT EXISTS public;
-- Tablas: tenants, plans, subscriptions

-- Schema por tenant (se crea al registrar nueva empresa)
CREATE SCHEMA IF NOT EXISTS uniminuto;
-- Tablas: users, roles, academic_programs, entrepreneurship, etc.
```

En Prisma, se usa la feature `multiSchema`:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public", "uniminuto", "otra_empresa"]
}
```

> **Nota:** El schema `public` es compartido globalmente para datos de configuración del SaaS.
> El schema de cada tenant contiene todos sus datos operacionales.
> Esto permite que cada empresa tenga total aislamiento de datos.

---

## Ventajas de Schema-based vs Column-based

| Aspecto | Schema-based | Column-based (tenant_id) |
|---------|-------------|--------------------------|
| Aislamiento | Total | Parcial |
| Seguridad |天然 | Requiere filtrar por tenant_id |
| Backup por tenant | Sí | No |
| Personalización de tablas | Sí | No |
| Complejidad técnica | Media | Baja |
| Performance sin índices | Alta | Requiere índices compuestos |
| Migraciones | Por schema | Global |

Para instituciones como UNIMINUTO, el schema-based es la mejor opción porque:
- Los datos son sensibles y necesitan aislamiento
- Cada institución puede tener tablas ligeramente diferentes
- Se pueden hacer backups individuales

---

## Configuración de Tenant (Ejemplo)

```typescript
// packages/config/tenants/uniminuto.ts
export const uniminutoTenant = {
  name: 'UNIMINUTO',
  slug: 'uniminuto',
  emailDomain: '@uniminuto.edu',
  schemaName: 'uniminuto',
  colors: {
    primary: '#0057a4',
    secondary: '#ffc400',
    sidebar: '#0c4a6e',
  },
  auth: {
    providers: ['azure-ad'],
    azureAdConfig: {
      tenantId: process.env.AZURE_AD_TENANT_ID,
      clientId: process.env.AZURE_AD_CLIENT_ID,
    },
  },
  features: {
    academicPrograms: true,
    universityCenters: true,
    populationTypes: true,
    events: true,
    diagnostics: true,
  },
};
```
