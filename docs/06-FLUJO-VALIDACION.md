# 06 — Flujo de Validación Progresiva + Diagnóstico

---

## Visión General

El emprendedor no tiene acceso completo desde el registro. Su acceso se **desbloquea progresivamente** mediante un sistema de validación en etapas. Cada etapa requiere intervención de un administrador.

```
REGISTRO ──► PERFIL ──► ASESORÍA ──► DIAGNÓSTICO ──► CARTA ──► ACCESO COMPLETO
   │           │           │              │              │             │
   ▼           ▼           ▼              ▼              ▼             ▼
PENDING    PROFILE    DIAGNOSTICS    DIAGNOSTICS    LETTER       FULLY
_PROFILE   _COMPLETED _ACCESS        _DONE          _ACCESS      _VALIDATED
                                     └─► Scoring + PDFs
                                     └─► Dashboard
```

---

## Etapa 0: PENDING_PROFILE

**Estado inicial.** El usuario acaba de registrarse.

**Acceso del emprendedor:**
- ✅ Editar su perfil (nombre, documento, género, estado civil, programa académico, etc.)
- ❌ No puede crear emprendimiento
- ❌ No puede ver diagnósticos
- ❌ No puede solicitar asesorías
- ❌ No puede ver dashboard

**Lógica:**
```typescript
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

**El emprendedor completó su perfil.** Se notifica al administrador.

**Disparador:** El emprendedor completa todos los campos obligatorios del perfil.

```typescript
const user = await prisma.user.update({
  where: { id: session.user.id },
  data: { validationStage: 'PROFILE_COMPLETED' },
});

await prisma.notification.create({
  data: {
    userId: admin.id,
    title: 'Perfil completado',
    message: `${user.name} ha completado su perfil y espera asesoría de bienvenida.`,
    type: 'info',
    link: `/admin/usuarios/${user.id}`,
  },
});
```

**Acceso del emprendedor:**
- ✅ Editar perfil
- ✅ Ver notificaciones
- ❌ No puede crear emprendimiento
- ❌ No puede ver diagnósticos

**Acción del administrador:**
- Ve la notificación en su dashboard
- Accede al perfil del emprendedor
- Agenda una **asesoría de bienvenida** (fecha, modalidad, asesor)

---

## Etapa 2: DIAGNOSTICS_ACCESS

**El administrador habilita el acceso a los módulos de Emprendimiento y Diagnóstico.**

```typescript
const user = await prisma.user.update({
  where: { id: userId },
  data: { validationStage: 'DIAGNOSTICS_ACCESS' },
});

await prisma.validationLog.create({
  data: {
    userId,
    fromStage: 'PROFILE_COMPLETED',
    toStage: 'DIAGNOSTICS_ACCESS',
    changedBy: session.user.id,
    comment: 'Admin habilitó acceso a diagnóstico',
  },
});
```

**Nuevo acceso del emprendedor:**
- ✅ Crear emprendimiento
- ✅ Completar formulario de diagnóstico (caracterización + valoración)
- ✅ Editar perfil
- ✅ Ver notificaciones
- ❌ No puede solicitar asesorías regulares
- ❌ No puede descargar carta compromiso

---

## Etapa 3: DIAGNOSTICS_DONE (Scoring + PDFs + Dashboard)

**El emprendedor completó el formulario de diagnóstico.** El sistema:

1. **Calcula automáticamente** los puntajes por dimensión según las `ScoringRules` del template
2. **Genera automáticamente** dos PDFs:
   - **CARACTERIZACIÓN**: Datos del perfil del emprendedor y su proyecto
   - **VALORACIÓN Y DIAGNÓSTICO**: Scores por dimensión + gráfico radar
3. **Prepara el dashboard** con widgets configurables (radar, barras, gauge, scorecards)
4. **Notifica al administrador** para verificación

### Arquitectura del scoring

Cada empresa (tenant) tiene su propio `DiagnosticTemplate` que define:

```
DiagnosticTemplate
├── scoringValues: { "Si": 100, "Parcialmente": 50, "No": 0 }
├── scoringLevels: [{ min: 0, max: 33, label: "Bajo", color: "red" }, ...]
├── DiagnosticDimensions (6 para UNIMINUTO)
│   └── ScoringRules → preguntas que componen cada dimensión
└── DashboardWidgets (radar, bar, gauge, scorecard)
```

**Cálculo de puntajes:**
```
Score por dimensión = Promedio de valores de sus preguntas
Score general = Promedio de todas las dimensiones
Nivel = Bajo (0-33) | Medio (34-66) | Alto (67-100)
```

### Flujo de verificación del admin

```
Admin ve diagnóstico completado
├── Revisa PDFs generados (caracterización + valoración)
├── Revisa dashboard con scores
├── Si es correcto → LETTER_ACCESS
└── Si es incorrecto → DIAGNOSTICS_ACCESS (emprendedor corrige)
```

```typescript
if (approved) {
  await prisma.user.update({
    where: { id: userId },
    data: { validationStage: 'LETTER_ACCESS' },
  });

  await prisma.notification.create({
    data: {
      userId,
      title: 'Diagnóstico aprobado',
      message: 'Tu diagnóstico ha sido verificado. Ahora puedes descargar la carta de compromiso.',
      type: 'success',
      link: '/emprendedor/carta-compromiso',
    },
  });
}
```

---

## Etapa 4: LETTER_ACCESS → LETTER_UPLOADED

**El emprendedor descarga, firma y sube la carta de compromiso.**

```typescript
await prisma.entrepreneurship.update({
  where: { userId: session.user.id },
  data: {
    commitmentLetter: url,
    commitmentLetterUploadedAt: new Date(),
  },
});

await prisma.user.update({
  where: { id: session.user.id },
  data: { validationStage: 'LETTER_UPLOADED' },
});
```

---

## Etapa 5: FULLY_VALIDATED

**Acceso completo a todos los módulos.**

**Acceso FINAL del emprendedor:**
- ✅ Dashboard personal con gráficos de diagnóstico (radar, barras, gauge, scorecards)
- ✅ Emprendimiento (CRUD completo)
- ✅ Diagnóstico (ver resultados + PDFs generados)
- ✅ Solicitar asesorías
- ✅ Eventos (ver + registrarse)
- ✅ Seguimiento
- ✅ Recursos
- ✅ Perfil
- ✅ Notificaciones

---

## Dashboard de Diagnóstico

Los gráficos se renderizan según los `DashboardWidgets` configurados en el template:

| Widget | Tipo | Descripción |
|--------|------|-------------|
| Radar | `radar` | Comparación multi-dimensional (6 dimensiones) |
| Barras | `bar` | Comparación por dimensión (horizontal) |
| Gauge | `gauge` | Score general 0-100% con umbrales de color |
| Scorecards | `scorecard` | Tarjetas por dimensión con nivel (Bajo/Medio/Alto) |

La generación de datos del dashboard se realiza mediante:

```typescript
import { getDashboardData } from "database";

const dashboard = await getDashboardData(userId, templateId);
// → { generalScore, generalLevel, dimensions[], widgets[] }
```

---

## Diagrama de Estados

```
                  ┌──────────────┐
                  │PENDING_PROFILE│
                  └──────┬───────┘
                         │ (completa perfil)
                         ▼
                  ┌──────────────┐
                  │PROFILE_COMPLETED──► NOTIFICACIÓN A ADMIN
                  └──────┬───────┘
                         │ (admin agenda asesoría + habilita)
                         ▼
                  ┌──────────────┐
                  │DIAGNOSTICS_ACCESS│
                  └──────┬───────┘
                         │ (emprendedor completa diagnóstico)
                         ▼
                  ┌──────────────┐
                  │DIAGNOSTICS_DONE──► Sistema: calcula scores + genera PDFs
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
          │LETTER_UPLOADED──► NOTIFICACIÓN A ADMIN
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
const stages = [
  { key: 'PENDING_PROFILE', label: 'Registro', color: 'bg-gray-200' },
  { key: 'PROFILE_COMPLETED', label: 'Perfil', color: 'bg-blue-400' },
  { key: 'DIAGNOSTICS_ACCESS', label: 'Diagnóstico', color: 'bg-indigo-400' },
  { key: 'LETTER_ACCESS', label: 'Carta', color: 'bg-orange-400' },
  { key: 'FULLY_VALIDATED', label: 'Completo', color: 'bg-green-500' },
];

export function ValidationProgress({ stage }: { stage: string }) {
  const currentIndex = stages.findIndex(s => s.key === stage);

  return (
    <div className="flex items-center justify-between mb-8">
      {stages.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center
            ${i <= currentIndex ? 'bg-primary text-white' : 'bg-gray-200'}`}>
            {i < currentIndex ? '✓' : i + 1}
          </div>
          <span className="text-sm ml-2">{s.label}</span>
          {i < stages.length - 1 && (
            <div className={`h-1 w-16 mx-2 rounded
              ${i < currentIndex ? 'bg-primary' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
```
