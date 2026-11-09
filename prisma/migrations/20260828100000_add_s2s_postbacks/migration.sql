CREATE TYPE "PostbackProvider" AS ENUM ('AFFMINE', 'ADBLUMEDIA');

CREATE TABLE "postback_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "PostbackProvider" NOT NULL,
    "label" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "postback_configs_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "conversion_leads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postbackId" TEXT NOT NULL,
    "externalLeadId" TEXT,
    "clickId" TEXT,
    "campaignId" TEXT,
    "campaignName" TEXT,
    "payout" DOUBLE PRECISION,
    "status" INTEGER NOT NULL DEFAULT 1,
    "country" TEXT,
    "ipAddress" TEXT,
    "sub1" TEXT,
    "sub2" TEXT,
    "sub3" TEXT,
    "sub4" TEXT,
    "occurredAt" TIMESTAMP(3),
    "rawData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversion_leads_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "postback_configs_token_key" ON "postback_configs"("token");
CREATE UNIQUE INDEX "postback_configs_userId_provider_key" ON "postback_configs"("userId", "provider");
CREATE INDEX "postback_configs_token_isActive_idx" ON "postback_configs"("token", "isActive");
CREATE INDEX "conversion_leads_userId_createdAt_idx" ON "conversion_leads"("userId", "createdAt");
CREATE INDEX "conversion_leads_postbackId_createdAt_idx" ON "conversion_leads"("postbackId", "createdAt");
CREATE INDEX "conversion_leads_externalLeadId_idx" ON "conversion_leads"("externalLeadId");
ALTER TABLE "postback_configs" ADD CONSTRAINT "postback_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversion_leads" ADD CONSTRAINT "conversion_leads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversion_leads" ADD CONSTRAINT "conversion_leads_postbackId_fkey" FOREIGN KEY ("postbackId") REFERENCES "postback_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;