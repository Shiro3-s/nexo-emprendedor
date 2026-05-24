-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tenants";

-- CreateEnum
CREATE TYPE "tenants"."Gender" AS ENUM ('MASCULINO', 'FEMENINO', 'OTRO');

-- CreateEnum
CREATE TYPE "tenants"."ValidationStage" AS ENUM ('PENDING_PROFILE', 'PROFILE_COMPLETED', 'ADVISORY_MEETING', 'DIAGNOSTICS_ACCESS', 'DIAGNOSTICS_DONE', 'LETTER_ACCESS', 'LETTER_UPLOADED', 'FULLY_VALIDATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "tenants"."AdvisoryStatus" AS ENUM ('PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "tenants"."AdvisoryModality" AS ENUM ('PRESENCIAL', 'VIRTUAL', 'MIXTA');

-- CreateEnum
CREATE TYPE "tenants"."EntrepreneurshipStage" AS ENUM ('IDEACION', 'PROTOTIPADO', 'VALIDACION', 'LANZAMIENTO');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "emailDomain" TEXT NOT NULL,
    "schemaName" TEXT NOT NULL,
    "logo" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#0057a4',
    "secondaryColor" TEXT NOT NULL DEFAULT '#ffc400',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantUser" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "TenantUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."AcademicProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."UniversityCenter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."CivilStatus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CivilStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "image" TEXT,
    "documentType" TEXT,
    "documentNumber" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" "tenants"."Gender",
    "maritalStatus" TEXT,
    "semester" TEXT,
    "modality" TEXT,
    "roleId" TEXT NOT NULL,
    "academicProgramId" TEXT,
    "universityCenterId" TEXT,
    "validationStage" "tenants"."ValidationStage" NOT NULL DEFAULT 'PENDING_PROFILE',
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."Entrepreneurship" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stage" "tenants"."EntrepreneurshipStage" NOT NULL DEFAULT 'IDEACION',
    "economicSector" TEXT,
    "businessModel" TEXT,
    "startDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "commitmentLetter" TEXT,
    "commitmentLetterUploadedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entrepreneurship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."AdvisorAssignment" (
    "id" TEXT NOT NULL,
    "entrepreneurshipId" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AdvisorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."DiagnosticSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."DiagnosticQuestion" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."DiagnosticResponse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."AdvisoryRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "tenants"."AdvisoryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvisoryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."Advisory" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "modality" "tenants"."AdvisoryModality" NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "location" TEXT,
    "virtualLink" TEXT,
    "comments" TEXT,
    "status" "tenants"."AdvisoryStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advisory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."ValidationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromStage" "tenants"."ValidationStage" NOT NULL,
    "toStage" "tenants"."ValidationStage" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "modality" "tenants"."AdvisoryModality" NOT NULL,
    "location" TEXT,
    "virtualLink" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "maxAttendees" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."EventAttendee" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "EventAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_schemaName_key" ON "Tenant"("schemaName");

-- CreateIndex
CREATE UNIQUE INDEX "TenantUser_tenantId_email_key" ON "TenantUser"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "tenants"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "tenants"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Entrepreneurship_userId_key" ON "tenants"."Entrepreneurship"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdvisorAssignment_entrepreneurshipId_key" ON "tenants"."AdvisorAssignment"("entrepreneurshipId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticResponse_userId_questionId_key" ON "tenants"."DiagnosticResponse"("userId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "EventAttendee_eventId_userId_key" ON "tenants"."EventAttendee"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "TenantUser" ADD CONSTRAINT "TenantUser_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "tenants"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."User" ADD CONSTRAINT "User_academicProgramId_fkey" FOREIGN KEY ("academicProgramId") REFERENCES "tenants"."AcademicProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."User" ADD CONSTRAINT "User_universityCenterId_fkey" FOREIGN KEY ("universityCenterId") REFERENCES "tenants"."UniversityCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."Entrepreneurship" ADD CONSTRAINT "Entrepreneurship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tenants"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."AdvisorAssignment" ADD CONSTRAINT "AdvisorAssignment_entrepreneurshipId_fkey" FOREIGN KEY ("entrepreneurshipId") REFERENCES "tenants"."Entrepreneurship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."DiagnosticQuestion" ADD CONSTRAINT "DiagnosticQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "tenants"."DiagnosticSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."DiagnosticResponse" ADD CONSTRAINT "DiagnosticResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tenants"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."DiagnosticResponse" ADD CONSTRAINT "DiagnosticResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "tenants"."DiagnosticQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."AdvisoryRequest" ADD CONSTRAINT "AdvisoryRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tenants"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."Advisory" ADD CONSTRAINT "Advisory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "tenants"."AdvisoryRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."ValidationLog" ADD CONSTRAINT "ValidationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tenants"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tenants"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tenants"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."EventAttendee" ADD CONSTRAINT "EventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "tenants"."Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
