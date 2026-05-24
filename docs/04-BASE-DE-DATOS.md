# 04 — Base de Datos: PostgreSQL + Prisma

---

## Estrategia Multi-Tenant

Dos niveles de esquemas en PostgreSQL:

- **`public`** — Datos compartidos entre todos los tenants (registro de empresas, usuarios maestros)
- **`tenants`** — Template de estructura que se clona por cada tenant (aislamiento total de datos)

Cada nuevo tenant recibe su propio schema (`uniminuto`, `camara_comercio`, etc.) con la misma estructura que `tenants`. Esto permite:
- Aislamiento completo de datos
- Backups individuales por tenant
- Personalización de catálogos sin impacto en otros tenants

---

## Modelo de Datos Completo

### Schema Global (`public`)

```prisma
model Tenant {
  id             String       @id @default(cuid())
  name           String
  slug           String       @unique
  domain         String       @unique
  emailDomain    String
  schemaName     String       @unique
  logo           String?
  primaryColor   String       @default("#0057a4")
  secondaryColor String       @default("#ffc400")
  isActive       Boolean      @default(true)
  config         Json?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  users          TenantUser[]

  @@schema("public")
}

model TenantUser {
  id       String @id @default(cuid())
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id])
  email    String
  role     String
  @@unique([tenantId, email])
  @@schema("public")
}
```

### Schema por Tenant (`tenants` — template)

#### Enumeraciones

```prisma
enum Gender {
  MASCULINO FEMENINO OTRO
  @@schema("tenants")
}

enum ValidationStage {
  PENDING_PROFILE
  PROFILE_COMPLETED
  ADVISORY_MEETING
  DIAGNOSTICS_ACCESS
  DIAGNOSTICS_DONE
  LETTER_ACCESS
  LETTER_UPLOADED
  FULLY_VALIDATED
  REJECTED
  @@schema("tenants")
}

enum AdvisoryStatus {
  PENDING SCHEDULED COMPLETED CANCELLED
  @@schema("tenants")
}

enum AdvisoryModality {
  PRESENCIAL VIRTUAL MIXTA
  @@schema("tenants")
}

enum EntrepreneurshipStage {
  IDEACION PROTOTIPADO VALIDACION LANZAMIENTO
  @@schema("tenants")
}
```

#### Catálogos configurables por tenant

```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  users       User[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@schema("tenants")
}

model AcademicProgram {
  id        String   @id @default(cuid())
  name      String
  code      String?
  isActive  Boolean  @default(true)
  users     User[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@schema("tenants")
}

model UniversityCenter {
  id        String   @id @default(cuid())
  name      String
  code      String?
  location  String?
  isActive  Boolean  @default(true)
  users     User[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@schema("tenants")
}

model CivilStatus {
  id        String   @id @default(cuid())
  name      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@schema("tenants")
}
```

#### Usuarios

```prisma
model User {
  id              String          @id @default(cuid())
  email           String          @unique
  name            String
  passwordHash    String?
  image           String?

  documentType    String?
  documentNumber  String?
  phone           String?
  address         String?
  birthDate       DateTime?
  gender          Gender?
  maritalStatus   String?
  semester        String?
  modality        String?

  roleId          String
  role            Role            @relation(fields: [roleId], references: [id])
  academicProgramId String?
  academicProgram AcademicProgram? @relation(fields: [academicProgramId], references: [id])
  universityCenterId String?
  universityCenter UniversityCenter? @relation(fields: [universityCenterId], references: [id])

  validationStage ValidationStage @default(PENDING_PROFILE)

  createdBy       String?
  updatedBy       String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  entrepreneurship  Entrepreneurship?
  advisoryRequests  AdvisoryRequest[]
  notifications     Notification[]
  validationLogs    ValidationLog[]
  auditLogs         AuditLog[]
  diagnosticResponses DiagnosticResponse[]
  diagnosticScores    DiagnosticScore[]
  generatedDocuments  GeneratedDocument[]

  @@schema("tenants")
}
```

#### Emprendimiento

```prisma
model Entrepreneurship {
  id              String               @id @default(cuid())
  name            String
  description     String?
  stage           EntrepreneurshipStage @default(IDEACION)
  economicSector  String?
  businessModel   String?
  startDate       DateTime?
  isActive        Boolean              @default(true)

  commitmentLetter  String?
  commitmentLetterUploadedAt DateTime?

  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  advisor       AdvisorAssignment?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@schema("tenants")
}

model AdvisorAssignment {
  id                String   @id @default(cuid())
  entrepreneurshipId String  @unique
  entrepreneurship  Entrepreneurship @relation(fields: [entrepreneurshipId], references: [id])
  advisorId         String
  assignedById      String
  assignedAt        DateTime @default(now())
  isActive          Boolean  @default(true)

  @@schema("tenants")
}
```

#### Diagnóstico Dinámico

```prisma
// Plantilla de diagnóstico (cada tenant puede tener su propia metodología)
model DiagnosticTemplate {
  id          String   @id @default(cuid())
  name        String
  description String?
  isActive    Boolean  @default(true)

  // Config global de scoring
  scoringValues   Json?  // {"Si": 100, "No": 0, "Parcialmente": 50}
  scoringLevels   Json?  // [{"min":0,"max":33,"label":"Bajo","color":"red"}, ...]

  sections        DiagnosticSection[]
  dimensions      DiagnosticDimension[]
  dashboardWidgets DashboardWidget[]
  generatedDocuments GeneratedDocument[]
  scores          DiagnosticScore[]
  responses       DiagnosticResponse[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@schema("tenants")
}

model DiagnosticSection {
  id          String   @id @default(cuid())
  templateId  String
  template    DiagnosticTemplate @relation(fields: [templateId], references: [id])
  title       String
  description String?
  order       Int
  isActive    Boolean  @default(true)
  questions   DiagnosticQuestion[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@schema("tenants")
}

model DiagnosticQuestion {
  id        String   @id @default(cuid())
  sectionId String
  section   DiagnosticSection @relation(fields: [sectionId], references: [id])
  question  String
  type      String   // text, textarea, number, select, radio, checkbox, date
  options   Json?    // ["Op1","Op2"] para select/radio/checkbox
  required  Boolean  @default(true)
  order     Int
  isActive  Boolean  @default(true)

  mapsTo    String?  // Campo de User/Entrepreneurship al que mapea (ej: "name", "documentNumber")

  responses DiagnosticResponse[]
  scoringRules ScoringRule[]

  createdAt DateTime @default(now())
  @@schema("tenants")
}

// Dimensión a medir (ej: "Modelo de Negocio", "Finanzas")
model DiagnosticDimension {
  id         String   @id @default(cuid())
  templateId String
  template   DiagnosticTemplate @relation(fields: [templateId], references: [id])
  name       String
  color      String
  order      Int
  scoringRules ScoringRule[]
  scores     DiagnosticScore[]
  createdAt  DateTime @default(now())
  @@schema("tenants")
}

// Regla: qué preguntas componen cada dimensión y con qué peso
model ScoringRule {
  id          String   @id @default(cuid())
  dimensionId String
  dimension   DiagnosticDimension @relation(fields: [dimensionId], references: [id])
  questionId  String
  question    DiagnosticQuestion @relation(fields: [questionId], references: [id])
  weight      Float    @default(1.0)
  createdAt   DateTime @default(now())
  @@unique([dimensionId, questionId])
  @@schema("tenants")
}

// Score calculado por emprendedor en cada dimensión
model DiagnosticScore {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  dimensionId String
  dimension   DiagnosticDimension @relation(fields: [dimensionId], references: [id])
  templateId  String
  template    DiagnosticTemplate @relation(fields: [templateId], references: [id])
  rawScore    Float
  maxScore    Float
  percentage  Float
  level       String?
  createdAt   DateTime @default(now())
  @@unique([userId, dimensionId, templateId])
  @@schema("tenants")
}

// Respuesta a pregunta del diagnóstico
model DiagnosticResponse {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  questionId String
  question   DiagnosticQuestion @relation(fields: [questionId], references: [id])
  templateId String
  template   DiagnosticTemplate @relation(fields: [templateId], references: [id])
  value      Json
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@unique([userId, questionId])
  @@schema("tenants")
}

// Widget de dashboard configurable por template
model DashboardWidget {
  id          String   @id @default(cuid())
  templateId  String
  template    DiagnosticTemplate @relation(fields: [templateId], references: [id])
  type        String   // "radar", "bar", "gauge", "scorecard"
  title       String?
  dimensionIds Json
  config      Json?
  placement   String   // "overview", "diagnostics", "entrepreneurship"
  order       Int
  createdAt   DateTime @default(now())
  @@schema("tenants")
}

// Documento generado automáticamente (PDF)
model GeneratedDocument {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  type       String   // "CHARACTERIZATION", "ASSESSMENT", "COMMITMENT_LETTER"
  templateId String?
  template   DiagnosticTemplate? @relation(fields: [templateId], references: [id])
  url        String
  createdAt  DateTime @default(now())
  @@schema("tenants")
}
```

#### Asesorías

```prisma
model AdvisoryRequest {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  reason      String
  status      AdvisoryStatus @default(PENDING)
  createdAt   DateTime @default(now())
  advisories  Advisory[]
  @@schema("tenants")
}

model Advisory {
  id            String    @id @default(cuid())
  requestId     String
  request       AdvisoryRequest @relation(fields: [requestId], references: [id])
  advisorId     String
  modality      AdvisoryModality
  scheduledDate DateTime?
  location      String?
  virtualLink   String?
  comments      String?
  status        AdvisoryStatus @default(SCHEDULED)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  @@schema("tenants")
}
```

#### Validación y Auditoría

```prisma
model ValidationLog {
  id        String          @id @default(cuid())
  userId    String
  user      User            @relation(fields: [userId], references: [id])
  fromStage ValidationStage
  toStage   ValidationStage
  changedBy String
  comment   String?
  createdAt DateTime        @default(now())
  @@schema("tenants")
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String
  entity    String
  entityId  String
  oldValue  Json?
  newValue  Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  @@schema("tenants")
}
```

#### Notificaciones y Eventos

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String
  message   String
  type      String
  read      Boolean  @default(false)
  link      String?
  createdAt DateTime @default(now())
  @@schema("tenants")
}

model Event {
  id           String   @id @default(cuid())
  title        String
  description  String?
  type         String
  modality     AdvisoryModality
  location     String?
  virtualLink  String?
  startDate    DateTime
  endDate      DateTime
  maxAttendees Int?
  isActive     Boolean  @default(true)
  attendees    EventAttendee[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@schema("tenants")
}

model EventAttendee {
  id      String @id @default(cuid())
  eventId String
  event   Event  @relation(fields: [eventId], references: [id])
  userId  String
  status  String
  @@unique([eventId, userId])
  @@schema("tenants")
}
```

---

## Seguridad

### Validación de schemaName (anti SQLi)

Toda operación que use `$executeRawUnsafe` con nombres de schema aplica:

```typescript
const SCHEMA_REGEX = /^[a-z][a-z0-9_]{0,62}$/;

function validateSchemaName(schemaName: string): void {
  if (!SCHEMA_REGEX.test(schemaName)) {
    throw new Error(`Schema name inválido: "${schemaName}".`);
  }
}
```

Esto rechaza cualquier nombre con espacios, comillas, punto y coma, guiones o caracteres especiales. Ver implementación en `packages/database/src/tenant.ts`.

### Zod para campos JSON

Los campos `scoringValues`, `scoringLevels`, `dimensionIds` y `config` se validan con Zod antes de usarse. Si fallan, se usan defaults seguros — nunca se evalúa código dinámico (`eval`/`new Function`). Ver `packages/database/src/diagnostics.ts`.

---

## Scripts disponibles

```bash
# Migraciones
pnpm run db:migrate    # Crear nueva migración
pnpm run db:push       # Push directo del schema
pnpm run db:generate   # Regenerar Prisma Client
pnpm run db:seed       # Ejecutar seed
pnpm run db:studio     # Prisma Studio (UI)

# Crear un nuevo tenant
pnpm create:tenant uniminuto "UNIMINUTO" "@uniminuto.edu"
```

### Script para crear un nuevo tenant

```javascript
// scripts/create-tenant.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SCHEMA_REGEX = /^[a-z][a-z0-9_]{0,62}$/;

function validateSlug(slug) {
  if (!SCHEMA_REGEX.test(slug)) {
    throw new Error(`Slug inválido: "${slug}". Solo minúsculas, números y guiones bajos.`);
  }
}

async function createTenant(slug, name, emailDomain) {
  validateSlug(slug);

  // 1. Crear schema en PostgreSQL
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${slug}";`);

  // 2. Clonar estructura desde el schema "tenants"
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE
      t text;
    BEGIN
      FOR t IN
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'tenants' AND table_type = 'BASE TABLE'
      LOOP
        EXECUTE format('CREATE TABLE IF NOT EXISTS %I.%I (LIKE "tenants".%I INCLUDING ALL)', '${slug}', t, t);
      END LOOP;
    END $$;
  `);

  // 3. Crear roles por defecto
  await prisma.$executeRawUnsafe(`SET search_path TO "${slug}";`);
  for (const role of ["ADMIN", "ASESOR", "EMPRENDEDOR"]) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role, description: `Rol ${role}` },
    });
  }

  // 4. Registrar el tenant
  const tenant = await prisma.tenant.create({
    data: {
      name, slug, emailDomain,
      domain: `${slug}.nexoemprendedor.com`,
      schemaName: slug,
    },
  });

  console.log(`Tenant ${name} creado en schema ${slug}`);
  return tenant;
}
```
