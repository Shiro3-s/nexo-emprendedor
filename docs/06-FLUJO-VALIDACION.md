# 06 — Flujo de Validación en 3 Etapas

---

## Visión General

El emprendedor no tiene acceso completo desde el registro. Su acceso se **desbloquea progresivamente** mediante un sistema de validación de 3 etapas. Cada etapa requiere la intervención de un administrador.

```
REGISTRO ──► PERFIL ──► ASESORÍA ──► DIAGNÓSTICO ──► CARTA ──► ACCESO COMPLETO
   │            │           │              │           │              │
   ▼            ▼           ▼              ▼           ▼              ▼
PENDING    PROFILE    ADVISORY      DIAGNOSTICS   LETTER       FULLY
_PROFILE   _COMPLETED _MEETING      _ACCESS       _ACCESS      _VALIDATED
                                    └─► DIAGNOSTICS_DONE
                                    └─► LETTER_UPLOADED
```

---

## Etapa 0: PENDING_PROFILE

**Estado inicial.** El usuario acaba de registrarse (vía Azure AD o formulario).

**Acceso del emprendedor:**
- ✅ Editar su perfil (nombre, documento, género, estado civil, programa académico, etc.)
- ❌ No puede crear emprendimiento
- ❌ No puede ver diagnósticos
- ❌ No puede solicitar asesorías
- ❌ No puede ver eventos

**Lógica:**

```typescript
// Al registrar
const user = await prisma.user.create({
  data: {
    email,
    name,
    roleId: emprendedorRole.id,
    validationStage: 'PENDING_PROFILE',
  },
});
```

---

## Etapa 1: PROFILE_COMPLETED

**El emprendedor completó su perfil.** Se genera una notificación al administrador.

**Disparador:** El emprendedor completa todos los campos obligatorios del perfil.

```typescript
// apps/web/src/app/api/emprendedor/perfil/route.ts
export async function PUT(req: Request) {
  const session = await auth();
  const data = await req.json();

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...data,
      validationStage: 'PROFILE_COMPLETED',
    },
  });

  // Notificar a los administradores
  const admins = await prisma.user.findMany({
    where: { role: { name: 'ADMIN' } },
  });

  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'Perfil completado',
        message: `${user.name} ha completado su perfil y espera asesoría de bienvenida.`,
        type: 'info',
        link: `/admin/usuarios/${user.id}`,
      },
    });
  }

  return Response.json({ success: true });
}
```

**Acceso del emprendedor:**
- ✅ Editar perfil
- ✅ Ver notificaciones
- ❌ No puede crear emprendimiento
- ❌ No puede ver diagnósticos

**Acción del administrador:**
- Ve la notificación en su dashboard
- Accede al perfil del emprendedor
- Agenda una **asesoría de bienvenida**:
  - Define fecha y modalidad (presencial/virtual/mixta)
  - Asigna un asesor específico
  - Agrega comentarios

---

## Etapa 2: ADVISORY_MEETING → DIAGNOSTICS_ACCESS

**El administrador asignó y respondió la asesoría de bienvenida.** Ahora puede habilitar el acceso a los módulos de Emprendimiento y Diagnóstico.

**Flujo admin:**
1. Admin ve notificación de perfil completado
2. Admin agenda asesoría (modalidad + asesor + fecha)
3. Asesoría se marca como completada
4. Admin cambia `validationStage` a `DIAGNOSTICS_ACCESS`
5. Emprendedor recibe notificación con acceso a nuevos módulos

```typescript
// Admin habilita diagnóstico
export async function POST(req: Request) {
  const { userId } = await req.json();
  const session = await auth();

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      validationStage: 'DIAGNOSTICS_ACCESS',
    },
  });

  // Log de auditoría
  await prisma.validationLog.create({
    data: {
      userId,
      fromStage: 'PROFILE_COMPLETED',
      toStage: 'DIAGNOSTICS_ACCESS',
      changedBy: session.user.id,
      comment: 'Admin habilitó acceso a diagnóstico',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'APPROVE',
      entity: 'User',
      entityId: user.id,
      newValue: { validationStage: 'DIAGNOSTICS_ACCESS' },
    },
  });

  return Response.json({ success: true });
}
```

**Nuevo acceso del emprendedor:**
- ✅ Crear emprendimiento
- ✅ Completar formulario de diagnóstico
- ✅ Editar perfil
- ✅ Ver notificaciones
- ❌ No puede solicitar asesorías regulares
- ❌ No puede descargar carta compromiso

---

## Etapa 3: DIAGNOSTICS_DONE → LETTER_ACCESS

**El emprendedor completó el formulario de diagnóstico.** El administrador debe verificar la información.

**Verificación del admin:**
1. Admin ve respuesta del diagnóstico
2. Admin verifica que los datos sean correctos
3. Si son correctos → Avanza a `LETTER_ACCESS`
4. Si son incorrectos → Rechaza con comentario, emprendedor corrige

```typescript
// Admin verifica diagnóstico
export async function POST(req: Request) {
  const { userId, approved, comment } = await req.json();
  const session = await auth();

  if (approved) {
    await prisma.user.update({
      where: { id: userId },
      data: { validationStage: 'LETTER_ACCESS' },
    });

    // Notificar al emprendedor
    await prisma.notification.create({
      data: {
        userId,
        title: 'Diagnóstico aprobado',
        message: 'Tu diagnóstico ha sido verificado. Ahora puedes descargar la carta de compromiso.',
        type: 'success',
        link: '/emprendedor/carta-compromiso',
      },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { validationStage: 'DIAGNOSTICS_ACCESS' },
    });

    await prisma.notification.create({
      data: {
        userId,
        title: 'Diagnóstico rechazado',
        message: `Tu diagnóstico necesita correcciones: ${comment}`,
        type: 'warning',
        link: '/emprendedor/diagnostico',
      },
    });
  }
}
```

**Nuevo acceso del emprendedor:**
- ✅ Descargar PDF de Carta de Compromiso
- ✅ Crear emprendimiento
- ✅ Editar perfil
- ✅ Ver notificaciones
- ❌ No puede solicitar asesorías regulares

---

## Etapa 4: LETTER_UPLOADED

**El emprendedor descargó, firmó y subió la carta de compromiso.** Notificación al administrador.

```typescript
// Emprendedor sube carta firmada
export async function POST(req: Request) {
  const session = await auth();
  const formData = await req.formData();
  const file = formData.get('file') as File;

  // Subir archivo a S3/Uploadthing
  const url = await uploadFile(file);

  // Actualizar emprendimiento
  await prisma.entrepreneurship.update({
    where: { userId: session.user.id },
    data: {
      commitmentLetter: url,
      commitmentLetterUploadedAt: new Date(),
    },
  });

  // Avanzar etapa
  await prisma.user.update({
    where: { id: session.user.id },
    data: { validationStage: 'LETTER_UPLOADED' },
  });

  // Notificar admins
  const admins = await prisma.user.findMany({
    where: { role: { name: 'ADMIN' } },
  });

  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'Carta de compromiso subida',
        message: 'Un emprendedor ha subido su carta de compromiso firmada.',
        type: 'info',
        link: `/admin/usuarios/${session.user.id}`,
      },
    });
  }

  return Response.json({ success: true });
}
```

---

## Etapa 5: FULLY_VALIDATED

**El administrador verificó la carta de compromiso firmada.** El emprendedor recibe acceso completo a todos los módulos.

```typescript
// Admin verifica carta
export async function POST(req: Request) {
  const { userId, approved, comment } = await req.json();
  const session = await auth();

  if (approved) {
    await prisma.user.update({
      where: { id: userId },
      data: { validationStage: 'FULLY_VALIDATED' },
    });

    await prisma.notification.create({
      data: {
        userId,
        title: '¡Validación completa!',
        message: 'Felicidades, tu proceso de validación ha sido completado. Ahora tienes acceso a todos los módulos.',
        type: 'success',
        link: '/emprendedor/dashboard',
      },
    });
  }
}
```

**Acceso FINAL del emprendedor:**
- ✅ Dashboard personal
- ✅ Emprendimiento (CRUD completo)
- ✅ Diagnóstico (ver)
- ✅ Solicitar asesorías (solo el botón)
- ✅ Eventos (ver + registrarse)
- ✅ Seguimiento
- ✅ Recursos
- ✅ Perfil
- ✅ Notificaciones

---

## Diagrama de Estados

```
                  ┌──────────────┐
                  │PENDING_PROFILE│
                  └──────┬───────┘
                         │ (completa perfil)
                         ▼
                  ┌──────────────┐
                  │PROFILE_COMPLETED──────► NOTIFICACIÓN A ADMIN
                  └──────┬───────┘
                         │ (admin agenda asesoría + habilita)
                         ▼
                  ┌──────────────┐
                  │DIAGNOSTICS_ACCESS│
                  └──────┬───────┘
                         │ (emprendedor completa diagnóstico)
                         ▼
                  ┌──────────────┐
                  │DIAGNOSTICS_DONE──────► NOTIFICACIÓN A ADMIN
                  └──────┬───────┘
                    ┌────┴────┐
                    ▼         ▼
             (aprueba)   (rechaza)
                  │         │
                  ▼         └────► DIAGNOSTICS_ACCESS (corrige)
          ┌──────────────┐
          │LETTER_ACCESS │
          └──────┬───────┘
                 │ (emprendedor descarga, firma, sube)
                 ▼
          ┌──────────────┐
          │LETTER_UPLOADED──────► NOTIFICACIÓN A ADMIN
          └──────┬───────┘
            ┌────┴────┐
            ▼         ▼
      (aprueba)   (rechaza)
            │         │
            ▼         └────► LETTER_ACCESS (corrige)
   ┌──────────────┐
   │FULLY_VALIDATED│
   └──────────────┘
```

---

## Componente de Barra de Progreso

```tsx
// apps/web/src/components/emprendedor/ValidationProgress.tsx
'use client';

interface ValidationProgressProps {
  stage: string;
}

const stages = [
  { key: 'PENDING_PROFILE', label: 'Registro', icon: '📝' },
  { key: 'PROFILE_COMPLETED', label: 'Perfil', icon: '👤' },
  { key: 'DIAGNOSTICS_ACCESS', label: 'Diagnóstico', icon: '📋' },
  { key: 'LETTER_ACCESS', label: 'Carta', icon: '📄' },
  { key: 'FULLY_VALIDATED', label: 'Completo', icon: '✅' },
];

export function ValidationProgress({ stage }: ValidationProgressProps) {
  const currentIndex = stages.findIndex(s => s.key === stage);

  return (
    <div className="flex items-center justify-between mb-8">
      {stages.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center
            ${i <= currentIndex ? 'bg-primary text-white' : 'bg-gray-200'}
          `}>
            {s.icon}
          </div>
          <span className="text-sm ml-2">{s.label}</span>
          {i < stages.length - 1 && (
            <div className={`h-1 w-16 mx-2 rounded ${
              i < currentIndex ? 'bg-primary' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
```
