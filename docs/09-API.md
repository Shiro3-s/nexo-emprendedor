# 09 — API Endpoints

---

## Convenciones

- **Base URL:** `https://{tenant}.nexoemprendedor.com/api/{recurso}`
- **Autenticación:** JWT via NextAuth (session token en cookie)
- **Formato:** JSON
- **Errores:** `{ error: string, message: string, statusCode: number }`
- **Paginación:** `{ data: [], meta: { page, pageSize, total } }`

---

## Autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/[...nextauth]` | No | NextAuth handler |
| GET | `/api/auth/session` | No | Obtener sesión actual |
| POST | `/api/auth/signout` | Sí | Cerrar sesión |

Gestionado por NextAuth.js. Ver [docs/05-AUTENTICACION.md](./05-AUTENTICACION.md).

---

## Admin

### Usuarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/users` | Listar todos los usuarios |
| GET | `/api/admin/users/stats` | Estadísticas de usuarios |
| GET | `/api/admin/users/[id]` | Obtener usuario por ID |
| POST | `/api/admin/users` | Crear usuario |
| PUT | `/api/admin/users/[id]` | Actualizar usuario |
| DELETE | `/api/admin/users/[id]` | Desactivar usuario |
| POST | `/api/admin/users/[id]/reactivate` | Reactivar usuario |

### Validación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/admin/validate/approve-profile` | Aprobar perfil → habilita diagnóstico |
| POST | `/api/admin/validate/approve-diagnostic` | Aprobar diagnóstico → habilita carta |
| POST | `/api/admin/validate/approve-letter` | Aprobar carta → validación completa |
| POST | `/api/admin/validate/reject` | Rechazar en cualquier etapa |
| GET | `/api/admin/validate/logs` | Historial de validaciones |

### Diagnósticos (gestión admin)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/diagnostics` | Listar diagnósticos completados |
| GET | `/api/admin/diagnostics/templates` | Listar plantillas de diagnóstico del tenant |
| POST | `/api/admin/diagnostics/templates` | Crear plantilla de diagnóstico |
| PUT | `/api/admin/diagnostics/templates/[id]` | Actualizar plantilla |
| GET | `/api/admin/diagnostics/[userId]` | Ver respuestas + scores de un usuario |
| POST | `/api/admin/diagnostics/[userId]/verify` | Verificar diagnóstico |
| GET | `/api/admin/diagnostics/[userId]/scores` | Scores calculados por dimensión |
| GET | `/api/admin/diagnostics/[userId]/dashboard` | Datos del dashboard (gráficos) |
| GET | `/api/admin/diagnostics/[userId]/documents` | PDFs generados |

### Asesorías (gestión admin)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/advisories` | Listar solicitudes de asesoría |
| GET | `/api/admin/advisories/pending` | Solicitudes pendientes |
| POST | `/api/admin/advisories/assign` | Asignar asesor + modalidad |

### Emprendimientos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/entrepreneurships` | Listar todos |
| GET | `/api/admin/entrepreneurships/[id]` | Detalle |
| PUT | `/api/admin/entrepreneurships/[id]` | Actualizar |
| DELETE | `/api/admin/entrepreneurships/[id]` | Eliminar |

### Cartas de Compromiso

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/commitment-letters` | Listar cartas subidas |
| GET | `/api/admin/commitment-letters/[userId]` | Ver carta |
| POST | `/api/admin/commitment-letters/[userId]/verify` | Verificar carta |

### Exportación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/admin/export/csv` | Exportar datos a CSV |
| POST | `/api/admin/export/pdf` | Exportar datos a PDF |
| POST | `/api/admin/export/diagnostic-report/[userId]` | Exportar reporte de diagnóstico (scoring + gráficos) |
| GET | `/api/admin/export/reportes` | Listar reportes disponibles |

**Body (POST):**
```json
{
  "entity": "users|entrepreneurships|advisories|diagnostics",
  "format": "csv|pdf",
  "filters": {
    "dateFrom": "2024-01-01",
    "dateTo": "2024-12-31",
    "role": "EMPRENDEDOR",
    "validationStage": "FULLY_VALIDATED",
    "academicProgramId": "xxx"
  },
  "columns": ["name", "email", "createdAt"]
}
```

### Carga Masiva CSV

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/admin/upload-csv/users` | Cargar usuarios desde CSV |
| POST | `/api/admin/upload-csv/entrepreneurships` | Cargar emprendimientos |
| POST | `/api/admin/upload-csv/catalogs` | Cargar catálogos |
| GET | `/api/admin/upload-csv/templates` | Descargar plantillas CSV |

### Configuración

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/config/catalogs` | Obtener catálogos del tenant |
| POST | `/api/admin/config/catalogs` | Crear catálogo |
| PUT | `/api/admin/config/catalogs/[id]` | Actualizar catálogo |
| DELETE | `/api/admin/config/catalogs/[id]` | Eliminar catálogo |

### Auditoría

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/audit-logs` | Listar logs de auditoría |
| GET | `/api/admin/audit-logs/user/[userId]` | Logs de un usuario específico |

### Estadísticas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/stats` | Dashboard metrics |
| GET | `/api/admin/stats/diagnostic-averages` | Promedios de diagnóstico por dimensión |
| GET | `/api/admin/stats/entrepreneurships-by-stage` | Emprendimientos por etapa |
| GET | `/api/admin/stats/advisories-by-month` | Asesorías por mes |
| GET | `/api/admin/stats/validations` | Estado de validaciones |

---

## Asesor

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/asesor/advisories` | Mis asesorías asignadas |
| GET | `/api/asesor/advisories/[id]` | Detalle asesoría |
| PUT | `/api/asesor/advisories/[id]` | Actualizar estado asesoría |
| GET | `/api/asesor/entrepreneurships` | Emprendimientos asignados |
| GET | `/api/asesor/entrepreneurships/[id]` | Detalle emprendimiento |
| POST | `/api/asesor/tracing` | Crear seguimiento |
| GET | `/api/asesor/tracing/entrepreneurship/[id]` | Seguimientos de emprendimiento |
| GET | `/api/asesor/stats` | Dashboard del asesor |
| GET | `/api/asesor/diagnostics/[userId]/dashboard` | Ver dashboard de diagnóstico del emprendedor asignado |

---

## Emprendedor

### Perfil

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/emprendedor/profile` | Obtener mi perfil |
| PUT | `/api/emprendedor/profile` | Actualizar perfil (y avanzar etapa) |
| GET | `/api/emprendedor/profile/validation` | Estado de validación actual |

### Emprendimiento

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/emprendedor/entrepreneurship` | Mi emprendimiento |
| POST | `/api/emprendedor/entrepreneurship` | Crear emprendimiento |
| PUT | `/api/emprendedor/entrepreneurship` | Actualizar emprendimiento |

### Diagnóstico

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/emprendedor/diagnostic/template` | Obtener template activo (secciones + preguntas) |
| GET | `/api/emprendedor/diagnostic/sections` | Obtener secciones del formulario |
| GET | `/api/emprendedor/diagnostic/questions/[sectionId]` | Preguntas de una sección |
| PUT | `/api/emprendedor/diagnostic/response` | Guardar respuesta a pregunta |
| POST | `/api/emprendedor/diagnostic/submit` | Marcar diagnóstico como completado (dispara scoring + PDFs) |
| GET | `/api/emprendedor/diagnostic/progress` | Progreso del diagnóstico |
| GET | `/api/emprendedor/diagnostic/results` | Scores calculados por dimensión |
| GET | `/api/emprendedor/diagnostic/documents` | PDFs generados (caracterización + valoración) |

### Dashboard

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/emprendedor/dashboard/overview` | Dashboard principal (score general + scorecards) |
| GET | `/api/emprendedor/dashboard/diagnostics` | Gráficos de diagnóstico (radar + barras) |
| GET | `/api/emprendedor/dashboard/evolution` | Evolución de scores en el tiempo (múltiples diagnósticos) |

### Carta de Compromiso

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/emprendedor/commitment-letter/download` | Descargar PDF de carta |
| POST | `/api/emprendedor/commitment-letter/upload` | Subir carta firmada |
| GET | `/api/emprendedor/commitment-letter/status` | Estado de la carta |

### Asesorías

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/emprendedor/request-advisory` | Solicitar asesoría |
| GET | `/api/emprendedor/advisories` | Mis asesorías |

### Eventos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/emprendedor/events` | Listar eventos |
| GET | `/api/emprendedor/events/[id]` | Detalle evento |
| POST | `/api/emprendedor/events/[id]/register` | Registrarse a evento |
| DELETE | `/api/emprendedor/events/[id]/unregister` | Cancelar registro |

---

## Catálogos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/catalogs/document-types` | Tipos de documento |
| GET | `/api/catalogs/civil-status` | Estados civiles |
| GET | `/api/catalogs/academic-programs` | Programas académicos |
| GET | `/api/catalogs/uni-centers` | Centros universitarios |
| GET | `/api/catalogs/economic-sectors` | Sectores económicos |
| GET | `/api/catalogs/entrepreneurship-stages` | Etapas de emprendimiento |
| GET | `/api/catalogs/population-types` | Tipos de población |
| GET | `/api/catalogs/event-types` | Tipos de evento |

---

## Notificaciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/notifications` | Mis notificaciones |
| GET | `/api/notifications/unread-count` | Cantidad de no leídas |
| PUT | `/api/notifications/[id]/read` | Marcar como leída |
| PUT | `/api/notifications/read-all` | Marcar todas como leídas |

---

## Respuestas de Ejemplo

### Éxito
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 100
  }
}
```

### Error
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "El género debe ser MASCULINO, FEMENINO u OTRO",
  "details": [
    { "field": "gender", "message": "Valor inválido" }
  ]
}
```

### Dashboard (ejemplo)
```json
{
  "success": true,
  "data": {
    "generalScore": 68,
    "generalLevel": "Medio",
    "dimensions": [
      { "dimensionName": "MODELO DE NEGOCIO", "percentage": 75, "level": "Alto", "color": "#4F46E5" },
      { "dimensionName": "MARKETING Y MERCADEO", "percentage": 50, "level": "Medio", "color": "#06B6D4" },
      { "dimensionName": "PRODUCTO O SERVICIO", "percentage": 33, "level": "Bajo", "color": "#10B981" },
      { "dimensionName": "ADMIN FINANCIERO Y LEGAL", "percentage": 67, "level": "Medio", "color": "#F59E0B" },
      { "dimensionName": "INNOVACIÓN", "percentage": 100, "level": "Alto", "color": "#EF4444" },
      { "dimensionName": "SOSTENIBILIDAD", "percentage": 83, "level": "Alto", "color": "#8B5CF6" }
    ],
    "widgets": [
      { "type": "gauge", "title": "Score General", "placement": "overview" },
      { "type": "scorecard", "title": null, "placement": "overview" },
      { "type": "radar", "title": "Rendimiento por Dimensión", "placement": "diagnostics" },
      { "type": "bar", "title": "Comparación por Dimensión", "placement": "diagnostics" }
    ]
  }
}
```
