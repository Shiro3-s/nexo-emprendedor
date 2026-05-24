# 07 — Estructura del Proyecto

---

## Árbol Completo

```
nexo-emprendedor/
│
├── apps/
│   └── web/                              # Next.js 14+ (App Router)
│       ├── public/
│       │   └── img/                      # Imágenes estáticas
│       │
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx            # Root layout (provee tenant)
│       │   │   ├── page.tsx              # Landing page
│       │   │   │
│       │   │   ├── (public)/             # Rutas públicas (sin auth)
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── login/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── register/
│       │   │   │   │   └── page.tsx
│       │   │   │   └── error/
│       │   │   │       └── page.tsx
│       │   │   │
│       │   │   ├── (dashboard)/          # Rutas protegidas (requieren auth)
│       │   │   │   ├── layout.tsx        # Dashboard layout (sidebar + header)
│       │   │   │   ├── dashboard/
│       │   │   │   │   └── page.tsx      # Redirige según rol
│       │   │   │   │
│       │   │   │   ├── admin/
│       │   │   │   │   ├── layout.tsx    # Admin layout con sidebar
│       │   │   │   │   ├── page.tsx      # Dashboard admin (métricas)
│       │   │   │   │   ├── usuarios/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── usuarios/[id]/
│       │   │   │   │   │   └── page.tsx  # Detalle usuario + validación
│       │   │   │   │   ├── asesores/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── asesorias/
│       │   │   │   │   │   └── page.tsx  # Gestión de asesorías pendientes
│       │   │   │   │   ├── emprendimientos/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── [id]/
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   ├── eventos/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── diagnosticos/
│       │   │   │   │   │   └── page.tsx  # Revisión de diagnósticos
│       │   │   │   │   ├── cartas/
│       │   │   │   │   │   └── page.tsx  # Revisión de cartas de compromiso
│       │   │   │   │   ├── exportar/
│       │   │   │   │   │   └── page.tsx  # Exportación con filtros
│       │   │   │   │   ├── carga-masiva/
│       │   │   │   │   │   └── page.tsx  # Carga CSV
│       │   │   │   │   ├── configuracion/
│       │   │   │   │   │   └── page.tsx  # Catálogos del tenant
│       │   │   │   │   └── auditoria/
│       │   │   │   │       └── page.tsx  # Logs de auditoría
│       │   │   │   │
│       │   │   │   ├── asesor/
│       │   │   │   │   ├── layout.tsx
│       │   │   │   │   ├── page.tsx      # Dashboard asesor
│       │   │   │   │   ├── asesorias/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── nueva/
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   └── [id]/
│       │   │   │   │   │       ├── page.tsx
│       │   │   │   │   │       └── editar/
│       │   │   │   │   │           └── page.tsx
│       │   │   │   │   ├── emprendimientos/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── seguimientos/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── perfil/
│       │   │   │   │       └── page.tsx
│       │   │   │   │
│       │   │   │   └── emprendedor/
│       │   │   │       ├── layout.tsx
│       │   │   │       ├── page.tsx      # Dashboard emprendedor
│       │   │   │       ├── perfil/
│       │   │   │       │   └── page.tsx
│       │   │   │       ├── emprendimiento/
│       │   │   │       │   ├── page.tsx
│       │   │   │       │   └── [id]/
│       │   │   │       │       └── page.tsx
│       │   │   │       ├── diagnostico/
│       │   │   │       │   └── page.tsx
│       │   │   │       ├── carta-compromiso/
│       │   │   │       │   └── page.tsx  # Descargar + subir
│       │   │   │       ├── asesorias/
│       │   │   │       │   └── page.tsx  # Solo botón "Solicitar asesoría"
│       │   │   │       ├── eventos/
│       │   │   │       │   └── page.tsx
│       │   │   │       ├── seguimiento/
│       │   │   │       │   └── page.tsx
│       │   │   │       └── recursos/
│       │   │   │           └── page.tsx
│       │   │   │
│       │   │   └── api/                  # API Routes
│       │   │       ├── auth/
│       │   │       │   └── [...nextauth]/
│       │   │       │       └── route.ts
│       │   │       │
│       │   │       ├── admin/
│       │   │       │   ├── users/
│       │   │       │   │   ├── route.ts
│       │   │       │   │   └── [id]/
│       │   │       │   │       └── route.ts
│       │   │       │   ├── validate/
│       │   │       │   │   └── route.ts  # Cambiar validationStage
│       │   │       │   ├── export/
│       │   │       │   │   └── route.ts  # CSV/PDF
│       │   │       │   ├── upload-csv/
│       │   │       │   │   └── route.ts  # Carga masiva
│       │   │       │   └── stats/
│       │   │       │       └── route.ts  # Métricas dashboard
│       │   │       │
│       │   │       ├── asesor/
│       │   │       │   ├── advisories/
│       │   │       │   │   └── route.ts
│       │   │       │   └── tracing/
│       │   │       │       └── route.ts
│       │   │       │
│       │   │       ├── emprendedor/
│       │   │       │   ├── profile/
│       │   │       │   │   └── route.ts
│       │   │       │   ├── entrepreneurship/
│       │   │       │   │   └── route.ts
│       │   │       │   ├── diagnostic/
│       │   │       │   │   └── route.ts
│       │   │       │   ├── commitment-letter/
│       │   │       │   │   └── route.ts
│       │   │       │   └── request-advisory/
│       │   │       │       └── route.ts
│       │   │       │
│       │   │       ├── catalogs/         # Catálogos del tenant
│       │   │       │   ├── academic-programs/
│       │   │       │   │   └── route.ts
│       │   │       │   ├── uni-centers/
│       │   │       │   │   └── route.ts
│       │   │       │   ├── civil-status/
│       │   │       │   │   └── route.ts
│       │   │       │   └── .../
│       │   │       │
│       │   │       ├── webhooks/
│       │   │       │   └── azure-ad/
│       │   │       │       └── route.ts
│       │   │       │
│       │   │       └── upload/
│       │   │           └── route.ts      # File upload endpoint
│       │   │
│       │   ├── components/
│       │   │   ├── ui/                   # shadcn/ui components
│       │   │   │   ├── button.tsx
│       │   │   │   ├── card.tsx
│       │   │   │   ├── input.tsx
│       │   │   │   ├── select.tsx
│       │   │   │   ├── table.tsx
│       │   │   │   ├── dialog.tsx
│       │   │   │   ├── toast.tsx
│       │   │   │   └── ...
│       │   │   │
│       │   │   ├── forms/                # Formularios
│       │   │   │   ├── ProfileForm.tsx
│       │   │   │   ├── DiagnosticForm.tsx
│       │   │   │   ├── EntrepreneurshipForm.tsx
│       │   │   │   └── AdvisoryForm.tsx
│       │   │   │
│       │   │   ├── layout/               # Componentes de layout
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   ├── Header.tsx
│       │   │   │   ├── TenantLogo.tsx
│       │   │   │   └── UserMenu.tsx
│       │   │   │
│       │   │   ├── shared/               # Componentes compartidos
│       │   │   │   ├── DataTable.tsx
│       │   │   │   ├── ExportButton.tsx
│       │   │   │   ├── FileUpload.tsx
│       │   │   │   ├── NotificationBell.tsx
│       │   │   │   ├── EmptyState.tsx
│       │   │   │   └── LoadingState.tsx
│       │   │   │
│       │   │   └── auth/
│       │   │       └── LoginForm.tsx
│       │   │
│       │   ├── lib/
│       │   │   ├── auth.ts               # NextAuth config
│       │   │   ├── db.ts                 # Prisma client singleton
│       │   │   ├── tenant.ts             # Tenant detection helpers
│       │   │   ├── validators.ts         # Zod schemas
│       │   │   ├── utils.ts              # Utilidades generales
│       │   │   ├── export.ts             # CSV/PDF export helpers
│       │   │   └── audit.ts              # Auditoría helper
│       │   │
│       │   ├── hooks/
│       │   │   ├── useTenant.ts
│       │   │   ├── useNotifications.ts
│       │   │   └── usePermissions.ts
│       │   │
│       │   └── styles/
│       │       └── globals.css           # Tailwind CSS
│       │
│       ├── prisma/
│       │   ├── schema.prisma             # Esquema completo
│       │   └── seed.ts                   # Datos iniciales
│       │
│       ├── middleware.ts                 # Tenant detection + Auth
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── postcss.config.js
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── shared-types/
│   │   ├── src/
│   │   │   └── index.ts                 # Tipos compartidos
│   │   └── package.json
│   │
│   ├── validators/
│   │   ├── src/
│   │   │   ├── user.ts                  # Schemas de usuario
│   │   │   ├── diagnostic.ts            # Schemas de diagnóstico
│   │   │   ├── entrepreneurship.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── database/
│   │   ├── src/
│   │   │   └── client.ts                # Prisma client singleton
│   │   └── package.json
│   │
│   └── config/
│       ├── src/
│       │   └── tenants/
│       │       ├── uniminuto.ts          # Config UNIMINUTO
│       │       └── template.ts           # Template para nuevos tenants
│       └── package.json
│
├── docs/                                 # Documentación
│   ├── 01-INTRODUCCION.md
│   ├── 02-TECH-STACK.md
│   ├── 03-ARQUITECTURA.md
│   ├── 04-BASE-DE-DATOS.md
│   ├── 05-AUTENTICACION.md
│   ├── 06-FLUJO-VALIDACION.md
│   ├── 07-ESTRUCTURA-PROYECTO.md
│   ├── 08-COMPONENTES.md
│   ├── 09-API.md
│   ├── 10-EXPORTACION.md
│   ├── 11-DESPLIEGUE.md
│   └── 12-PERSONALIZACION.md
│
├── scripts/
│   ├── create-tenant.js                  # Script para nuevo tenant
│   ├── seed-global.ts                    # Seed global (tenants)
│   └── migrate-all-schemas.ts            # Migrar todos los schemas
│
├── docker/
│   ├── Dockerfile                        # Docker image de la app
│   └── nginx.conf                        # Nginx reverse proxy
│
├── docker-compose.yml                    # Orquestación
├── package.json                          # Root workspace
├── tsconfig.json                         # Base tsconfig
├── turbo.json                            # Turborepo config
├── .gitignore
└── README.md
```

---

## Convenciones

### Nombres de archivos
- **Páginas:** `page.tsx` (convención Next.js)
- **Componentes:** `PascalCase.tsx` (ej: `ProfileForm.tsx`)
- **APIs:** `route.ts` (convención Next.js)
- **Librerías/helpers:** `camelCase.ts` (ej: `tenant.ts`)
- **Schemas Zod:** `camelCase.ts` (ej: `user.ts`)

### Estructura de API Routes
```
/api/{rol}/{recurso}/
    ├── route.ts     → GET (listar), POST (crear)
    └── [id]/
        └── route.ts → GET (uno), PUT/PATCH (actualizar), DELETE
```

### Convenciones de Base de Datos
- **IDs:** `cuid()` de Prisma (más legible que UUID)
- **Timestamps:** `createdAt`, `updatedAt`
- **Booleans:** `isActive`, `isRead`, etc.
- **Enums:** UPPER_SNAKE_CASE
- **Relaciones:** nombre en camelCase del modelo relacionado
