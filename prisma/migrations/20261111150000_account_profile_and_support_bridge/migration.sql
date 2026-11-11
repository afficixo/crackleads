-- Account profile fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "zipCode" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "companyName" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "companyAddress" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "companyCity" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "companyState" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "companyZipCode" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "companyCountry" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "leadNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "campaignEmailUpdates" BOOLEAN NOT NULL DEFAULT true;

-- Rebuild support conversations as publisher↔manager bridge
DROP TABLE IF EXISTS "support_messages";
DROP TABLE IF EXISTS "support_conversations";

CREATE TABLE "support_conversations" (
  "id" TEXT NOT NULL,
  "publisherId" TEXT NOT NULL,
  "managerId" TEXT,
  "status" "SupportStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "support_conversations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "support_conversations_publisherId_key" ON "support_conversations"("publisherId");
CREATE INDEX "support_conversations_status_updatedAt_idx" ON "support_conversations"("status", "updatedAt");
CREATE INDEX "support_conversations_managerId_updatedAt_idx" ON "support_conversations"("managerId", "updatedAt");

ALTER TABLE "support_conversations"
  ADD CONSTRAINT "support_conversations_publisherId_fkey"
  FOREIGN KEY ("publisherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_conversations"
  ADD CONSTRAINT "support_conversations_managerId_fkey"
  FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "support_messages" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_messages_conversationId_createdAt_idx" ON "support_messages"("conversationId", "createdAt");

ALTER TABLE "support_messages"
  ADD CONSTRAINT "support_messages_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "support_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_messages"
  ADD CONSTRAINT "support_messages_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
