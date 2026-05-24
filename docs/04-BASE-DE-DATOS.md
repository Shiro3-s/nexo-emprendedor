# 04 — Base de Datos: PostgreSQL + Prisma

---

## Modelo de Datos Completo

### Schema Global (`public`)

```prisma
// public schema — compartido entre todos los tenants
model Tenant {
  id             String   @id @default(cuid())
  name           String   // Nombre de la empresa
  slug           String   @unique // "uniminuto"
  domain         String   @unique // "uniminuto.nexoemprendedor.com"
  emailDomain    String   // "@uniminuto.edu"
  schemaName     String   @unique // "uniminuto"
  logo           String?
  primaryColor   String   @default("#0057a4")
  secondaryColor String   @default("#ffc400")
  isActive       Boolean  @default(true)
  config         Json?    // Features habilitadas y config extra
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model TenantUser {
  id       String @id @default(cuid())
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id])
  email    String
  role     String // "super_admin", "admin"
  @@unique([tenantId, email])
}
```

### Schema por Tenant (ej: `uniminuto`)

#### Enumeraciones

```prisma
enum Gender {
  MASCULINO
  FEMENINO
  OTRO
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
}

enum AdvisoryStatus {
  PENDING
  SCHEDULED
  COMPLETED
  CANCELLED
}

enum AdvisoryModality {
  PRESENCIAL
  VIRTUAL
  MIXTA
}

enum EntrepreneurshipStage {
  IDEACION
  PROTOTIPADO
  VALIDACION
  LANZAMIENTO
}
```

#### Usuarios

```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique // "ADMIN", "ASESOR", "EMPRENDEDOR"
  description String?
  users       User[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model User {
  id              String          @id @default(cuid())
  email           String          @unique
  name            String
  passwordHash    String?
  image           String?

  // Perfil completo
  documentType    String?         // CC, CE, Pasaporte, TI
  documentNumber  String?
  phone           String?
  address         String?
  birthDate       DateTime?
  gender          Gender?
  maritalStatus   String?         // Configurable por tenant
  semester        String?
  modality        String?

  // Relaciones
  roleId          String
  role            Role            @relation(fields: [roleId], references: [id])
  academicProgramId String?
  academicProgram AcademicProgram? @relation(fields: [academicProgramId], references: [id])
  universityCenterId String?
  universityCenter UniversityCenter? @relation(fields: [universityCenterId], references: [id])

  // Validación progresiva
  validationStage ValidationStage @default(PENDING_PROFILE)

  // Auditoría (todo cambio queda registrado)
  createdBy       String?
  updatedBy       String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // Relaciones
  entrepreneurship  Entrepreneurship?
  advisoryRequests  AdvisoryRequest[]
  notifications     Notification[]
  validationLogs    ValidationLog[]
  auditLogs         AuditLog[]
  diagnosticResponses DiagnosticResponse[]
}
```

#### Catálogos configurables por tenant

```prisma
model AcademicProgram {
  id        String   @id @default(cuid())
  name      String
  code      String?
  isActive  Boolean  @default(true)
  users     User[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
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
}

model CivilStatus {
  id        String   @id @default(cuid())
  name      String   // Soltero, Casado, Divorciado, etc.
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
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

  // Documentos
  commitmentLetter  String? // URL del PDF de carta de compromiso
  commitmentLetterUploadedAt DateTime?

  // Relaciones
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  advisor       AdvisorAssignment?

  // Auditoría
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model AdvisorAssignment {
  id                String   @id @default(cuid())
  entrepreneurshipId String  @unique
  entrepreneurship  Entrepreneurship @relation(fields: [entrepreneurshipId], references: [id])
  advisorId         String
  assignedById      String   // Quién asignó (admin)
  assignedAt        DateTime @default(now())
  isActive          Boolean  @default(true)
}
```

#### Diagnóstico Dinámico

```prisma
model DiagnosticSection {
  id          String   @id @default(cuid())
  title       String   // "Información General", "Modelo de Negocio", etc.
  description String?
  order       Int
  isActive    Boolean  @default(true)
  questions   DiagnosticQuestion[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model DiagnosticQuestion {
  id        String   @id @default(cuid())
  sectionId String
  section   DiagnosticSection @relation(fields: [sectionId], references: [id])
  question  String
  type      String   // text, textarea, number, select, radio, checkbox, multiselect, date
  options   Json?    // ["Op1","Op2"] para select/radio/checkbox
  required  Boolean  @default(true)
  order     Int
  isActive  Boolean  @default(true)
  responses DiagnosticResponse[]
  createdAt DateTime @default(now())
}

model DiagnosticResponse {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  questionId String
  question   DiagnosticQuestion @relation(fields: [questionId], references: [id])
  value      Json     // El valor de la respuesta
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([userId, questionId])
}
```

#### Asesorías

```prisma
model AdvisoryRequest {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  reason      String   // Motivo de la solicitud
  status      AdvisoryStatus @default(PENDING)
  createdAt   DateTime @default(now())
  advisories  Advisory[]
}

model Advisory {
  id            String    @id @default(cuid())
  requestId     String
  request       AdvisoryRequest @relation(fields: [requestId], references: [id])
  advisorId     String    // Asesor asignado por el admin
  modality      AdvisoryModality
  scheduledDate DateTime?
  location      String?   // Para presencial
  virtualLink   String?   // Para virtual
  comments      String?
  status        AdvisoryStatus @default(SCHEDULED)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

#### Validación (Logs de cada etapa)

```prisma
model ValidationLog {
  id        String          @id @default(cuid())
  userId    String
  user      User            @relation(fields: [userId], references: [id])
  fromStage ValidationStage
  toStage   ValidationStage
  changedBy String          // ID del admin
  comment   String?
  createdAt DateTime        @default(now())
}
```

#### Auditoría

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String   // CREATE, UPDATE, DELETE, APPROVE, REJECT
  entity    String   // "User", "Entrepreneurship", "DiagnosticResponse"
  entityId  String
  oldValue  Json?
  newValue  Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
}
```

#### Notificaciones

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String
  message   String
  type      String   // "info", "success", "warning", "error"
  read      Boolean  @default(false)
  link      String?  // Enlace a la acción relacionada
  createdAt DateTime @default(now())
}
```

#### Eventos

```prisma
model Event {
  id          String   @id @default(cuid())
  title       String
  description String?
  type        String   // Taller, Masterclass, Seminario
  modality    AdvisoryModality
  location    String?
  virtualLink String?
  startDate   DateTime
  endDate     DateTime
  maxAttendees Int?
  isActive    Boolean  @default(true)
  attendees   EventAttendee[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model EventAttendee {
  id      String @id @default(cuid())
  eventId String
  event   Event  @relation(fields: [eventId], references: [id])
  userId  String
  status  String // "confirmed", "cancelled"
  @@unique([eventId, userId])
}
```

---

## Migraciones con Prisma

```bash
# Inicializar Prisma en el proyecto
npx prisma init

# Crear migración inicial
npx prisma migrate dev --name init

# Generar cliente Prisma
npx prisma generate

# Ver datos con UI
npx prisma studio

# Crear schema de un nuevo tenant (script)
node scripts/create-tenant.js --slug=nueva-empresa
```

### Script para crear un nuevo tenant

```javascript
// scripts/create-tenant.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTenant(slug, name, emailDomain) {
  // 1. Crear el schema en PostgreSQL
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${slug}";`);
  
  // 2. Ejecutar migraciones en el schema
  await prisma.$executeRawUnsafe(`SET search_path TO "${slug}";`);
  await prisma.$executeRawUnsafe(`...`); // Migraciones
  
  // 3. Registrar el tenant
  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      domain: `${slug}.nexoemprendedor.com`,
      emailDomain,
      schemaName: slug,
      primaryColor: '#0057a4',
      secondaryColor: '#ffc400',
    },
  });
  
  console.log(`Tenant ${name} creado en schema ${slug}`);
  return tenant;
}
```
