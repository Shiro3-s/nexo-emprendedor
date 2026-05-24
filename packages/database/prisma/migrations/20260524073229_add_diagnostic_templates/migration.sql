/*
  Warnings:

  - Added the required column `templateId` to the `DiagnosticResponse` table without a default value. This is not possible if the table is not empty.
  - Added the required column `templateId` to the `DiagnosticSection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tenants"."DiagnosticQuestion" ADD COLUMN     "mapsTo" TEXT;

-- AlterTable
ALTER TABLE "tenants"."DiagnosticResponse" ADD COLUMN     "templateId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tenants"."DiagnosticSection" ADD COLUMN     "templateId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "tenants"."DiagnosticTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scoringValues" JSONB,
    "scoringLevels" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."DiagnosticDimension" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticDimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."ScoringRule" (
    "id" TEXT NOT NULL,
    "dimensionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoringRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."DiagnosticScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dimensionId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "rawScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "level" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."DashboardWidget" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "dimensionIds" JSONB NOT NULL,
    "config" JSONB,
    "placement" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardWidget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants"."GeneratedDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "templateId" TEXT,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScoringRule_dimensionId_questionId_key" ON "tenants"."ScoringRule"("dimensionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticScore_userId_dimensionId_templateId_key" ON "tenants"."DiagnosticScore"("userId", "dimensionId", "templateId");

-- AddForeignKey
ALTER TABLE "tenants"."DiagnosticSection" ADD CONSTRAINT "DiagnosticSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "tenants"."DiagnosticTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."DiagnosticDimension" ADD CONSTRAINT "DiagnosticDimension_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "tenants"."DiagnosticTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."ScoringRule" ADD CONSTRAINT "ScoringRule_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "tenants"."DiagnosticDimension"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."ScoringRule" ADD CONSTRAINT "ScoringRule_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "tenants"."DiagnosticQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."DiagnosticScore" ADD CONSTRAINT "DiagnosticScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tenants"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."DiagnosticScore" ADD CONSTRAINT "DiagnosticScore_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "tenants"."DiagnosticDimension"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."DiagnosticScore" ADD CONSTRAINT "DiagnosticScore_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "tenants"."DiagnosticTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."DiagnosticResponse" ADD CONSTRAINT "DiagnosticResponse_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "tenants"."DiagnosticTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."DashboardWidget" ADD CONSTRAINT "DashboardWidget_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "tenants"."DiagnosticTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tenants"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants"."GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "tenants"."DiagnosticTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
