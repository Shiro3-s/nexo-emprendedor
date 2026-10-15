# ADR-0003 — Estrategia de seguridad: NextAuth v5 + Azure AD con RBAC y validación progresiva

| Campo | Valor |
|-------|-------|
| **ID** | ADR-0003 |
| **Título** | Mecanismo de autenticación, identidad y autorización: NextAuth.js v5 (Auth.js) con Azure AD (Entra ID), sesión JWT y RBAC por etapas |
| **Estado** | 🟡 Propuesto |
| **Fecha** | 2026-10-14 |
| **Decisores** | Equipo Nexo Emprendedor |
| **ADR relacionados** | [ADR-0001](0001-patron-arquitectonico.md) · [ADR-0002](0002-sistema-de-persistencia.md) |
| **Diagramas** | [Secuencia proceso clave](../diagrams/secuencia-proceso-clave.puml) · [C4 Contexto](../diagrams/c4-contexto.puml) |

---

## 1. Contexto

La plataforma atiende a instituciones con **identidad corporativa**: los usuarios institucionales usan correos `@uniminuto.edu` gestionados en **Microsoft Entra ID (Azure AD)**. Se requiere:

- **Inicio de sesión institucional** (SSO) para emprendedores y asesores.
- **Control de acceso basado en roles (RBAC)**: `ADMIN`, `ASESOR`, `EMPRENDEDOR`.
- **Acceso progresivo** del emprendedor: el registro no otorga acceso total; se desbloquea por etapas validada por un administrador ([06-FLUJO-VALIDACION.md](../../06-FLUJO-VALIDACION.md)).
- **Trazabilidad y auditoría** de cada cambio de estado (`ValidationLog`, `AuditLog`).
- Un mecanismo de respaldo para administradores y situaciones de emergencia.

> **Estado Propuesto:** el mecanismo de SSO y RBAC ya está decidido en lo esencial, pero quedan **aspectos abiertos** (MFA, rotación de secretos, estrategia de revocación de sesión, política de contraseñas para Credentials) que impiden marcarlo como *Aceptado*. Este ADR documenta la decisión en revisión y sus pendientes.

---

## 2. Decisión

Adoptamos **NextAuth.js v5 (Auth.js)** con:

- **Proveedor principal:** **Microsoft Azure AD (Entra ID)** por OIDC, para usuarios institucionales.
- **Proveedor secundario:** **Credentials** (email + contraseña con `bcrypt`) para administradores y emergencias.
- **Sesión JWT** (24 h) con `id` y `role` inyectados en el token vía callbacks.
- **Validación de dominio por tenant**: `signIn` rechaza correos cuyo dominio no coincide con `tenant.emailDomain`.
- **Protección de rutas** con middleware: redirección por rol (`/admin` → ADMIN, `/asesor` → ASESOR, `/emprendedor` → EMPRENDEDOR).
- **Autorización por etapas**: `validationStage` controla qué módulos están disponibles; cada transición registra `ValidationLog` (de `fromStage` a `toStage`) y `AuditLog` (`APPROVE`/`REJECT`).

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  providers: [
    AzureADProvider({ /* ... */ }),
    CredentialsProvider({ /* ... bcrypt ... */ }),
  ],
  callbacks: {
    async signIn({ user }) {
      const tenant = await getTenant();
      if (!tenant) return false;
      return (user.email || '').endsWith(tenant.emailDomain);
    },
    // jwt() y session() propagan id y role
  },
});
```

---

## 3. Alternativas consideradas

| Alternativa | Motivo de descarte |
|-------------|--------------------|
| **Autenticación propia** (usuarios/contraseñas gestionados por la plataforma) | Duplica la gestión de identidad institucional, mayor superficie de ataque y peor experiencia para usuarios con cuenta corporativa. |
| **Proveedor OAuth genérico (Google)** | No corresponde a la identidad institucional de las universidades objetivo; obligaría a cuentas personales. |
| **Auth0 / Cognito (IdP gestionado externo)** | Costo recurrente y dependencia de terceros; Azure AD ya está disponible en las instituciones objetivo. |

---

## 4. Consecuencias

**Positivas**

- **SSO institucional**: sin contraseñas nuevas para usuarios de Azure AD.
- **RBAC coherente** con el modelo de roles del dominio.
- **Trazabilidad**: cada aprobación/rechazo queda auditado.
- **Aislamiento reforzado**: la validación de dominio más el aislamiento por schema (ADR-0002) dificultan accesos cruzados entre tenants.

**Negativas / Trade-offs y pendientes**

- **Dependencia de Azure AD**: una caída del IdP impide el acceso (mitigado parcialmente por Credentials para admin).
- **JWT sin revocación inmediata**: cerrar sesión no invalida el token hasta su expiración; requiere lista de revocación o sesiones de base de datos si se endurece.
- **`AuditLog` debe centralizarse**: registrar la IP y el `userAgent` reales detrás del proxy.
- **Pendientes para pasar a Aceptado**: MFA obligatorio, rotación de `NEXTAUTH_SECRET` y secretos de Azure, política de contraseñas para Credentials.

---

## 5. Relación con otros ADRs

- **ADR-0001 (Patrón arquitectónico)**: autenticación y middleware viven en el mismo runtime (Next.js), sin saltos de red. → [ver](0001-patron-arquitectonico.md)
- **ADR-0002 (Persistencia)**: la sesión identifica al tenant y el aislamiento por schema restringe el acceso a datos; ambos forman la defensa multi-tenant. → [ver](0002-sistema-de-persistencia.md)
- **Diseño**: la autenticación y la validación progresiva se detallan en la [secuencia del proceso clave](../diagrams/secuencia-proceso-clave.puml); Azure AD aparece como sistema externo en el [C4 de contexto](../diagrams/c4-contexto.puml).

---

## 6. Referencias

- [05-AUTENTICACION.md](../../05-AUTENTICACION.md) — Configuración de NextAuth y Azure AD.
- [06-FLUJO-VALIDACION.md](../../06-FLUJO-VALIDACION.md) — Validación progresiva por etapas.
- [04-BASE-DE-DATOS.md](../../04-BASE-DE-DATOS.md) — `AuditLog`, `ValidationLog`, `Role`.
- [Auth.js — Azure AD Provider](https://authjs.dev/getting-started/providers/microsoft-entra-id).
