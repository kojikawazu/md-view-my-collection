-- GENERATED FILE — DO NOT EDIT BY HAND.
-- Source of truth: prisma/schema.prisma. Regenerate with: pnpm gen:test-schema
-- Applied only to the ephemeral test DB container (see tests/integration/global-setup.ts).

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "publishDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalUrl" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalUrl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTagMapping" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "reportTagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportTagMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_publishDate_idx" ON "Report"("publishDate");

-- CreateIndex
CREATE INDEX "Report_category_idx" ON "Report"("category");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "ExternalUrl_reportId_idx" ON "ExternalUrl"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportTag_name_key" ON "ReportTag"("name");

-- CreateIndex
CREATE INDEX "ReportTag_name_idx" ON "ReportTag"("name");

-- CreateIndex
CREATE INDEX "ReportTagMapping_reportId_idx" ON "ReportTagMapping"("reportId");

-- CreateIndex
CREATE INDEX "ReportTagMapping_reportTagId_idx" ON "ReportTagMapping"("reportTagId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportTagMapping_reportId_reportTagId_key" ON "ReportTagMapping"("reportId", "reportTagId");

-- AddForeignKey
ALTER TABLE "ExternalUrl" ADD CONSTRAINT "ExternalUrl_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTagMapping" ADD CONSTRAINT "ReportTagMapping_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTagMapping" ADD CONSTRAINT "ReportTagMapping_reportTagId_fkey" FOREIGN KEY ("reportTagId") REFERENCES "ReportTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

