# ADR-0001 — Patrón arquitectónico: Monolito Modular

| Campo | Valor |
|-------|-------|
| **ID** | ADR-0001 |
| **Título** | Elección del patrón arquitectónico: Monolito Modular (Next.js App Router + Turborepo) |
| **Estado** | ✅ Aceptado |
| **Fecha** | 2026-10-14 |
| **Decisores** | Equipo Nexo Emprendedor |
| **ADR relacionados** | [ADR-0002](0002-sistema-de-persistencia.md) · [ADR-0003](0003-estrategia-seguridad.md) |
| **Diagramas** | [C4 Contexto](../diagrams/c4-contexto.puml) · [Secuencia proceso clave](../diagrams/secuencia-proceso-clave.puml) |

---

## 1. Contexto

**Nexo Emprendedor** es una plataforma SaaS **multi-tenant** que debe acompañar a emprendedores de instituciones educativas, incubadoras y cámaras de comercio. El equipo de desarrollo es pequeño y el dominio funcional está en construcción (documentación de diseño, sin código productivo todavía).

Restricciones relevantes:

- Un **único código base** debe servir a múltiples instituciones ([01-INTRODUCCION.md](../../01-INTRODUCCION.md)).
- Se requiere **velocidad de entrega** y baja carga operativa.
- El sistema incluye frontend, backend (API) y lógica de negocio fuertemente acoplada al modelo de datos.
- Se necesitan **tipos compartidos** entre frontend, backend y base de datos.

La pregunta arquitectónica es: ¿cómo organizar el sistema para maximizar la velocidad de entrega hoy sin hipotecar la evolución futura?

---

## 2. Decisión

Adoptamos un **Monolito Modular** con:

- **Next.js 14+ (App Router)** como framework único: Server Components para frontend y **API Routes** para el backend, en un solo despliegue.
- **Monorepo con Turborepo + pnpm**, organizado por paquetes de dominio:
  - `apps/web` — aplicación Next.js (frontend + API).
  - `packages/shared-types` — tipos TypeScript compartidos.
  - `packages/validators` — schemas Zod compartidos.
  - `packages/database` — Prisma ORM.
  - `packages/config` — configuración por tenant.
- **Módulos internos** delimitados por dominio (auth, usuarios, diagnósticos, asesorías, exportación), con dependencias explícitas, aunque desplegados como una sola unidad.

La comunicación con la base de datos se delega al ORM dentro del mismo proceso; no hay llamadas de red entre frontend y backend.

---

## 3. Alternativas consideradas

| Alternativa | Motivo de descarte |
|-------------|--------------------|
| **Microservicios** | Complejidad operativa desproporcionada para el tamaño del equipo; requiere orquestación, red, observabilidad distribuida y transacciones distribuidas sin beneficio actual. |
| **Monolito en capas tradicional (MVC)** | Acoplamiento entre capas y dificultad de separar dominios; menos modularidad para aislar el contexto multi-tenant. |
| **Serverless puro (FaaS por función)** | Latencia en frío y gestión de estado/transacciones más compleja; encarece el flujo transaccional del onboarding. |

---

## 4. Consecuencias

**Positivas**

- **Despliegue único** (Docker Compose) → menor costo operativo y de DevOps.
- **Tipos compartidos** de extremo a extremo (TypeScript + Zod + Prisma) → menos errores de integración.
- **Onboarding rápido**: un solo repositorio, un solo `pnpm dev`.
- La modularidad interna permite **extraer un módulo a un servicio independiente** si el crecimiento lo exige (camino de evolución sin reescritura total).

**Negativas / Trade-offs**

- **Escalabilidad vertical** como límite: escalar implica escalar toda la aplicación.
- Riesgo de **acoplamiento accidental** entre módulos si no se respetan los límites (mitigado por convenciones de carpetas y revisiones).
- Un fallo en un módulo puede afectar a toda la instancia (aunque el aislamiento por tenant reduce el radio de impacto).

**Estado del arte**

- Se revisará la extracción de módulos a servicios cuando concurran: equipos múltiples independientes y cuellos de botella de rendimiento medidos.

---

## 5. Relación con otros ADRs

- **ADR-0002 (Persistencia)**: el monolito modular permite que un único ORM (Prisma) gestione el aislamiento por *schema* sin coordinación distribuida. → [ver](0002-sistema-de-persistencia.md)
- **ADR-0003 (Seguridad)**: la autenticación y el control de acceso (middleware + RBAC) se ejecutan en el mismo runtime, simplificando la coherencia de la sesión. → [ver](0003-estrategia-seguridad.md)
- **Diseño**: el patrón se refleja en el [diagrama C4 de contexto](../diagrams/c4-contexto.puml) (sistema único) y en la [secuencia del proceso clave](../diagrams/secuencia-proceso-clave.puml).

---

## 6. Referencias

- [02-TECH-STACK.md](../../02-TECH-STACK.md) — Next.js, TypeScript, Turborepo.
- [03-ARQUITECTURA.md](../../03-ARQUITECTURA.md) — Visión multi-tenant.
- [07-ESTRUCTURA-PROYECTO.md](../../07-ESTRUCTURA-PROYECTO.md) — Estructura de paquetes.
- [Diagrams as Code — PlantUML](https://plantuml.com/).
