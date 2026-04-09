-- Migration: Initial schema

-- Created: 2026-04-09

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "syncWebhookUrl" TEXT,
    "replyWebhookUrl" TEXT,
    "yelpApiKey" TEXT,
    "openaiApiKey" TEXT,
    "geminiApiKey" TEXT,
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "googlePlaceId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "businessHours" TEXT,
    "isSynced" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "googleReviewId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "replyText" TEXT,
    "isRepliedByAI" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'UPDATE',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledFor" TIMESTAMP(3),
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "googleAccountId" TEXT NOT NULL,
    "locationId" TEXT,
    "keywords" TEXT,
    "content" TEXT NOT NULL,
    "imageUrls" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserTenants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Location_googlePlaceId_key" ON "Location"("googlePlaceId");

-- CreateIndex
CREATE INDEX "Location_tenantId_idx" ON "Location"("tenantId");

-- CreateIndex
CREATE INDEX "Location_googlePlaceId_idx" ON "Location"("googlePlaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_googleReviewId_key" ON "Review"("googleReviewId");

-- CreateIndex
CREATE INDEX "Review_locationId_idx" ON "Review"("locationId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- CreateIndex
CREATE INDEX "Post_locationId_idx" ON "Post"("locationId");

-- CreateIndex
CREATE INDEX "Post_status_idx" ON "Post"("status");

-- CreateIndex
CREATE INDEX "Post_scheduledFor_idx" ON "Post"("scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleAccount_email_key" ON "GoogleAccount"("email");

-- CreateIndex
CREATE INDEX "CommentTask_tenantId_idx" ON "CommentTask"("tenantId");

-- CreateIndex
CREATE INDEX "CommentTask_googleAccountId_idx" ON "CommentTask"("googleAccountId");

-- CreateIndex
CREATE INDEX "CommentTask_createdAt_idx" ON "CommentTask"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_UserTenants_AB_unique" ON "_UserTenants"("A", "B");

-- CreateIndex
CREATE INDEX "_UserTenants_B_index" ON "_UserTenants"("B");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentTask" ADD CONSTRAINT "CommentTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentTask" ADD CONSTRAINT "CommentTask_googleAccountId_fkey" FOREIGN KEY ("googleAccountId") REFERENCES "GoogleAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentTask" ADD CONSTRAINT "CommentTask_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserTenants" ADD CONSTRAINT "_UserTenants_A_fkey" FOREIGN KEY ("A") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserTenants" ADD CONSTRAINT "_UserTenants_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
