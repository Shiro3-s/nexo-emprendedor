# 02 — Tech Stack: Tecnologías y Recursos de Aprendizaje

---

## 1. Next.js 14+ (App Router)

**Rol:** Framework principal. Maneja frontend + backend (API Routes) en un solo proyecto.

**Versión:** 14+ (recomendado 15+ cuando esté estable)

**Razones:**
- Server Components por defecto (mejor performance, SEO)
- API Routes integradas (no necesitas servidor aparte)
- App Router con layout anidados, loading states, error boundaries
- TypeScript nativo
- React Server Components + Client Components
- Gran ecosistema y comunidad

**Recursos de aprendizaje:**

| Recurso | Tipo | Enlace |
|---------|------|--------|
| Documentación oficial | Docs | https://nextjs.org/docs |
| Learn Next.js (curso gratis) | Tutorial | https://nextjs.org/learn |
| Next.js App Router Playground | Repo | https://github.com/vercel/app-playground |
| Next.js GitHub | Repo | https://github.com/vercel/next.js |
| Canal de Lee Robinson | YouTube | https://www.youtube.com/@leeerob |

---

## 2. TypeScript 5

**Rol:** Lenguaje principal. Tipado estático en frontend, backend, base de datos y schemas compartidos.

**Razones:**
- Detecta errores en tiempo de compilación
- Autocompletado en IDE
- Documentación viviente del código
- Interfaces compartidas entre frontend y backend

**Recursos de aprendizaje:**

| Recurso | Tipo | Enlace |
|---------|------|--------|
| TypeScript Handbook | Docs | https://www.typescriptlang.org/docs/handbook/ |
| TypeScript Playground | Herramienta | https://www.typescriptlang.org/play/ |
| Total TypeScript | Curso | https://www.totaltypescript.com/ |
| TypeScript Deep Dive | Libro gratis | https://basarat.gitbook.io/typescript/ |

---

## 3. PostgreSQL 16

**Rol:** Base de datos principal.

**Versión:** 16

**Razones:**
- Schemas nativos para multi-tenencia (cada tenant en su schema)
- JSONB para formularios dinámicos
- Buen rendimiento con consultas complejas
- Índices parciales y exclusión
- Extensiones como `uuid-ossp`, `pgcrypto`
- Mejor que MySQL en: tipos de datos, window functions, CTE, triggers

**Recursos de aprendizaje:**

| Recurso | Tipo | Enlace |
|---------|------|--------|
| PostgreSQL Official Docs | Docs | https://www.postgresql.org/docs/16/index.html |
| PostgreSQL Tutorial | Tutorial | https://www.postgresqltutorial.com/ |
| PgExercises | Ejercicios | https://pgexercises.com/ |
| Use the Index, Luke | Guía índices | https://use-the-index-luke.com/ |

---

## 4. Prisma

**Rol:** ORM (Object-Relational Mapping) para TypeScript.

**Versión:** 5+

**Razones:**
- Type-safe: cada query retorna tipos completos
- Migraciones automáticas
- Prisma Studio (UI para ver datos)
- Soporta multi-schema (vista previa)
- Integración perfecta con Next.js y TypeScript

**Recursos de aprendizaje:**

| Recurso | Tipo | Enlace |
|---------|------|--------|
| Prisma Docs | Docs | https://www.prisma.io/docs |
| Prisma Examples | Repo | https://github.com/prisma/prisma-examples |
| Prisma with Next.js | Guía | https://www.prisma.io/nextjs |
| Prisma Data Platform | Herramienta | https://www.prisma.io/data-platform |

---

## 5. Tailwind CSS v4

**Rol:** Framework de estilos utilitario.

**Versión:** 4

**Razones:**
- Utility-first: escribes estilos en el HTML, sin archivos CSS separados
- Compatibilidad excelente con IA (los modelos generan clases fácilmente)
- Sin conflictos de nombres
- Build pequeño con purga de CSS no usado
- Modo oscuro nativo
- Diseño responsive con clases simples
- Con shadcn/ui tienes componentes pre-hechos y accesibles

**Recursos de aprendizaje:**

| Recurso | Tipo | Enlace |
|---------|------|--------|
| Tailwind CSS Docs | Docs | https://tailwindcss.com/docs |
| Tailwind UI (componentes) | Componentes | https://tailwindui.com/ |
| Tailwind Play | Playground | https://play.tailwindcss.com/ |

---

## 6. shadcn/ui

**Rol:** Biblioteca de componentes UI basada en Radix + Tailwind.

**Razones:**
- No es un npm package, son componentes que copias a tu proyecto
- Basados en Radix UI (accesibles, headless)
- Estilizados con Tailwind (personalizables al 100%)
- Compatibles con Server Components
- El código es tuyo (los modificas directamente)

**Recursos de aprendizaje:**

| Recurso | Tipo | Enlace |
|---------|------|--------|
| shadcn/ui Docs | Docs | https://ui.shadcn.com/docs |
| shadcn/ui Components | Componentes | https://ui.shadcn.com/ |

---

## 7. NextAuth.js (Auth.js)

**Rol:** Autenticación.

**Versión:** 5

**Razones:**
- Multi-proveedor: Azure AD, Google, GitHub, Credentials
- Sesiones JWT o database
- Integración directa con Next.js (middleware, API routes, server components)
- Callbacks para lógica personalizada
- Seguro y probado

**Recursos de aprendizaje:**

| Recurso | Tipo | Enlace |
|---------|------|--------|
| Auth.js Docs | Docs | https://authjs.dev/ |
| NextAuth.js Docs | Docs | https://next-auth.js.org/ |
| Azure AD Provider | Docs | https://next-auth.js.org/providers/azure-ad |
| NextAuth with Next.js 14+ | Blog | https://authjs.dev/guides/nextjs |

---

## 8. Zod

**Rol:** Validación de schemas.

**Razones:**
- Schemas compartidos entre frontend y backend
- Inferencia automática de tipos TypeScript
- Mensajes de error personalizables
- Integración con React Hook Form

**Recursos de aprendizaje:**

| Recurso | Tipo | Enlace |
|---------|------|--------|
| Zod Docs | Docs | https://zod.dev/ |
| Zod GitHub | Repo | https://github.com/colinhacks/zod |

---

## 9. @react-pdf/renderer

**Rol:** Generación de PDFs desde React.

**Razones:**
- Escribes PDFs como componentes React
- Soporta fonts, imágenes, tablas
- Renderizado en servidor (getServerSideProps)
- Ideal para cartas de compromiso y reportes

**Recursos de aprendizaje:**

| Recurso | Tipo | Enlace |
|---------|------|--------|
| React-PDF Docs | Docs | https://react-pdf.org/ |
| React-PDF GitHub | Repo | https://github.com/diegomura/react-pdf |

---

## 10. papaparse

**Rol:** Parseo y generación de CSV.

**Razones:**
- Rápido, liviano
- Soporta archivos grandes
- Parseo de strings, archivos locales y remotos
- Generación de CSV desde JSON

**Recursos de aprendizaje:**

| Recurso | Tipo | Enlace |
|---------|------|--------|
| PapaParse Docs | Docs | https://www.papaparse.com/ |
| PapaParse GitHub | Repo | https://github.com/mholt/PapaParse |

---

## 11. Docker + Docker Compose

**Rol:** Contenedorización y despliegue.

**Razones:**
- Entorno reproducible (desarrollo = producción)
- Docker Compose orquesta PostgreSQL + app
- Fácil de desplegar en cualquier VPS

**Recursos de aprendizaje:**

| Recurso | Tipo | Enlace |
|---------|------|--------|
| Docker Docs | Docs | https://docs.docker.com/ |
| Docker Compose Docs | Docs | https://docs.docker.com/compose/ |
| Docker para desarrolladores | YouTube | https://www.youtube.com/watch?v=pr8L8t3aT0w |

---

## 12. Herramientas Adicionales

| Herramienta | Propósito | Recurso |
|-------------|-----------|---------|
| **pnpm** | Gestor de paquetes | https://pnpm.io/ |
| **Turborepo** | Monorepo build system | https://turbo.build/repo |
| **Vitest** | Testing unitario | https://vitest.dev/ |
| **Playwright** | Testing E2E | https://playwright.dev/ |
| **Sentry** | Monitoreo de errores | https://sentry.io/ |
| **Husky + lint-staged** | Git hooks | https://typicode.github.io/husky/ |
| **Prettier + ESLint** | Formato y linting | https://prettier.io/ / https://eslint.org/ |
| **Prisma Studio** | UI base de datos | `npx prisma studio` |
| **pgAdmin** | Admin PostgreSQL | https://www.pgadmin.org/ |
| **Uploadthing** | File uploads | https://uploadthing.com/ |

---

## Resumen de Instalaciones

```bash
# Proyecto principal
pnpm create next-app@latest apps/web --typescript --tailwind --app --src-dir
pnpm add -D turbo typescript @types/node

# Base de datos
pnpm add @prisma/client
pnpm add -D prisma

# UI
pnpm add -D tailwindcss @tailwindcss/postcss
npx shadcn@latest init

# Autenticación
pnpm add next-auth@beta @auth/prisma-adapter

# Validación
pnpm add zod react-hook-form @hookform/resolvers

# PDF
pnpm add @react-pdf/renderer

# CSV
pnpm add papaparse
pnpm add -D @types/papaparse

# Email
pnpm add resend
```
