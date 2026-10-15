# ADR-0002 — Sistema de persistencia: PostgreSQL multi-tenant por *schema* + Prisma

| Campo | Valor |
|-------|-------|
| **ID** | ADR-0002 |
| **Título** | Elección del sistema de persistencia: PostgreSQL 16 relacional con aislamiento por *schema* (multi-tenant) y Prisma ORM |
| **Estado** | ✅ Aceptado |
| **Fecha** | 2026-10-14 |
| **Decisores** | Equipo Nexo Emprendedor |
| **ADR relacionados** | [ADR-0001](0001-patron-arquitectonico.md) · [ADR-0003](0003-estrategia-seguridad.md) |
| **Diagramas** | [C4 Contexto](../diagrams/c4-contexto.puml) · [Secuencia proceso clave](../diagrams/secuencia-proceso-clave.puml) |

---

## 1. Contexto

Nexo Emprendedor almacena **datos sensibles** de emprendedores (documento de identidad, contacto, respuestas de diagnóstico) por cuenta de **múltiples instituciones**. Cada institución (tenant) es una organización distinta y exige:

- **Aislamiento de datos** entre instituciones.
- **Catálogos configurables** por tenant (programas académicos, centros, tipos de población).
- **Formularios de diagnóstico dinámicos** (estructura variable en el tiempo).
- Posibilidad de **backups individuales** por institución.

Al mismo tiempo, el modelo de datos es fuertemente relacional (usuarios → roles, emprendimiento → asesor, respuestas → preguntas, logs de validación y auditoría).

La pregunta es: ¿qué motor y qué estrategia de aislamiento multi-tenant adoptar?

---

## 2. Decisión

Usamos **PostgreSQL 16** con **aislamiento por *schema*** y **Prisma ORM**:

- **Motor relacional**: PostgreSQL 16 por su soporte nativo de *schemas*, `JSONB` para formularios dinámicos, índices parciales, CTE y funciones de ventana.
- **Estrategia multi-tenant**: un **schema `public` global** (tablas `tenants`, `plans`, `subscriptions`) y **un schema por tenant** (`uniminuto`, `camara_comercio`, `incubadora_x`, …) que contiene todos los datos operacionales.
- **Resolución de tenant por subdominio**: el middleware extrae el subdominio y lo mapea al `schemaName`; cada petición ejecuta `SET search_path TO "<tenant>", public;`.
- **Prisma con `multiSchema`** (feature de vista previa) como ORM, con migraciones por schema.

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

---

## 3. Alternativas consideradas

| Alternativa | Motivo de descarte |
|-------------|--------------------|
| **Base de datos NoSQL (MongoDB)** | El dominio es altamente relacional; se perderían integridad referencial, transacciones y consultas analíticas potentes. El aislamiento multi-tenant requeriría filtrar por `tenant_id` en cada consulta. |
| **Aislamiento por columna** (`tenant_id` en cada tabla, BD compartida) | **Aislamiento parcial**: un filtro olvidado expone datos de otra institución. Sin backups por tenant ni personalización de tablas. |
| **Base de datos por tenant (database-per-tenant)** | Aislamiento máximo, pero multiplica la carga operativa de conexiones, migraciones y costos; excesivo para el volumen actual. |

### Comparativa *Schema-based* vs *Column-based*

| Aspecto | Schema-based (elegido) | Column-based |
|---------|------------------------|--------------|
| Aislamiento | Total | Parcial |
| Seguridad | Nativa (por `search_path`) | Requiere filtrar por `tenant_id` |
| Backup por tenant | Sí | No |
| Personalización de tablas | Sí | No |
| Complejidad técnica | Media | Baja |
| Migraciones | Por schema | Global |

---

## 4. Consecuencias

**Positivas**

- **Aislamiento total** de datos: una consulta en un schema no puede leer otro por accidente.
- **Backups y restauración por institución**.
- **Catálogos y tablas personalizables** por tenant sin alterar a los demás.
- **Rendimiento** sin necesidad de índices compuestos por `tenant_id`.

**Negativas / Trade-offs**

- **Migraciones por schema**: hay que aplicar cambios a cada schema de tenant (automatizable con scripts).
- **Tooling**: `multiSchema` es *preview feature* de Prisma; requiere seguimiento de versiones.
- **Riesgo de `search_path`**: si no se fija correctamente, una consulta podría caer en `public`; se mitiga centralizando el acceso con un helper `withTenant()`.

---

## 5. Relación con otros ADRs

- **ADR-0001 (Patrón arquitectónico)**: el acceso a datos vive dentro del monolito modular, sin transacciones distribuidas. → [ver](0001-patron-arquitectonico.md)
- **ADR-0003 (Seguridad)**: el aislamiento por schema es la **primera línea de defensa** multi-tenant; la sesión JWT identifica al tenant y el `search_path` restringe cada consulta. → [ver](0003-estrategia-seguridad.md)
- **Diseño**: la base de datos aparece como contenedor externo en el [C4 de contexto](../diagrams/c4-contexto.puml) y como participante en la [secuencia del proceso clave](../diagrams/secuencia-proceso-clave.puml).

---

## 6. Referencias

- [04-BASE-DE-DATOS.md](../../04-BASE-DE-DATOS.md) — Modelo de datos y migraciones.
- [03-ARQUITECTURA.md](../../03-ARQUITECTURA.md) — Estrategia schema-based con subdominios.
- [02-TECH-STACK.md](../../02-TECH-STACK.md) — PostgreSQL 16 y Prisma.
- [Prisma multi-schema](https://www.prisma.io/docs/orm/prisma-schema/data-model/multi-schema).
