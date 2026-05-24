# Nexo Emprendedor

Plataforma SaaS de Gestión de Emprendimientos multi-tenant. Un solo código base, múltiples empresas.

**Eslogan:** *"Conectando emprendedores con el conocimiento que necesitan para crecer."*

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14+ (App Router) |
| Lenguaje | TypeScript 5 |
| Base de Datos | PostgreSQL 16 |
| ORM | Prisma |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Autenticación | NextAuth.js (Azure AD + Credentials) |
| Validación | Zod |
| PDF | @react-pdf/renderer |
| CSV | papaparse |
| Despliegue | Docker Compose |

## Estructura del Proyecto

```
nexo-emprendedor/
├── apps/
│   └── web/                    # Next.js (frontend + API)
├── packages/
│   ├── shared-types/           # Tipos TypeScript compartidos
│   ├── validators/             # Schemas Zod
│   ├── database/               # Prisma ORM
│   └── config/                 # Configuración por tenant
├── docs/                       # Documentación
├── scripts/                    # Utilidades
├── docker-compose.yml
└── package.json
```

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [01-INTRODUCCION.md](docs/01-INTRODUCCION.md) | Visión general del proyecto |
| [02-TECH-STACK.md](docs/02-TECH-STACK.md) | Tecnologías con fuentes de aprendizaje |
| [03-ARQUITECTURA.md](docs/03-ARQUITECTURA.md) | Arquitectura multi-tenant y subdominios |
| [04-BASE-DE-DATOS.md](docs/04-BASE-DE-DATOS.md) | Diseño de base de datos PostgreSQL + Prisma |
| [05-AUTENTICACION.md](docs/05-AUTENTICACION.md) | Autenticación con Azure AD y NextAuth |
| [06-FLUJO-VALIDACION.md](docs/06-FLUJO-VALIDACION.md) | Flujo de validación en 3 etapas |
| [07-ESTRUCTURA-PROYECTO.md](docs/07-ESTRUCTURA-PROYECTO.md) | Estructura detallada del proyecto |
| [08-COMPONENTES.md](docs/08-COMPONENTES.md) | Componentes y páginas del frontend |
| [09-API.md](docs/09-API.md) | Endpoints de la API |
| [10-EXPORTACION.md](docs/10-EXPORTACION.md) | Exportación CSV/PDF y carga masiva |
| [11-DESPLIEGUE.md](docs/11-DESPLIEGUE.md) | Despliegue con Docker |
| [12-PERSONALIZACION.md](docs/12-PERSONALIZACION.md) | Personalización por empresa |

## Inicio Rápido

```bash
# Requisitos: Node.js 20+, Docker, pnpm

pnpm install
docker compose up -d
pnpm dev
```

## Licencia

Propietaria — Nexo Emprendedor
