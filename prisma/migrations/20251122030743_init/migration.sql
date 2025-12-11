-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ScrapeJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Grant" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "amount" TEXT,
    "amountMin" INTEGER,
    "amountMax" INTEGER,
    "deadline" TIMESTAMP(3),
    "location" TEXT NOT NULL,
    "eligibility" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "applicationUrl" TEXT,
    "category" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scrapeJobId" TEXT,

    CONSTRAINT "Grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrantTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantTagRelation" (
    "grantId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "GrantTagRelation_pkey" PRIMARY KEY ("grantId","tagId")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastScraped" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrantSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapeJob" (
    "id" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "status" "ScrapeJobStatus" NOT NULL DEFAULT 'PENDING',
    "discoveredCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "grantSourceId" TEXT,

    CONSTRAINT "ScrapeJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Grant_deadline_idx" ON "Grant"("deadline");

-- CreateIndex
CREATE INDEX "Grant_location_idx" ON "Grant"("location");

-- CreateIndex
CREATE INDEX "Grant_category_idx" ON "Grant"("category");

-- CreateIndex
CREATE UNIQUE INDEX "GrantTag_name_key" ON "GrantTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GrantTag_slug_key" ON "GrantTag"("slug");

-- CreateIndex
CREATE INDEX "GrantTagRelation_grantId_idx" ON "GrantTagRelation"("grantId");

-- CreateIndex
CREATE INDEX "GrantTagRelation_tagId_idx" ON "GrantTagRelation"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GrantSource_url_key" ON "GrantSource"("url");

-- CreateIndex
CREATE INDEX "ScrapeJob_status_idx" ON "ScrapeJob"("status");

-- CreateIndex
CREATE INDEX "ScrapeJob_createdAt_idx" ON "ScrapeJob"("createdAt");

-- CreateIndex
CREATE INDEX "ScrapeJob_grantSourceId_idx" ON "ScrapeJob"("grantSourceId");

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_scrapeJobId_fkey" FOREIGN KEY ("scrapeJobId") REFERENCES "ScrapeJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantTagRelation" ADD CONSTRAINT "GrantTagRelation_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantTagRelation" ADD CONSTRAINT "GrantTagRelation_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "GrantTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapeJob" ADD CONSTRAINT "ScrapeJob_grantSourceId_fkey" FOREIGN KEY ("grantSourceId") REFERENCES "GrantSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
