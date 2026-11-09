-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'OWNER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'DISABLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OfferRotationMode" AS ENUM ('PRIORITY', 'RANDOM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "source" TEXT,
    "contractNumber" TEXT,
    "telegramUsername" TEXT,
    "bkashNumber" TEXT,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_accounts" (
    "id" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "customDomainId" TEXT,
    "offerGroupName" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
    "botClicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "link_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_domains" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "sslEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_vaults" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "groupName" TEXT,
    "offerUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "isContentLocker" BOOLEAN NOT NULL DEFAULT false,
    "usaSecretRedirectEnabled" BOOLEAN NOT NULL DEFAULT false,
    "usaSecretRedirectPercentage" INTEGER NOT NULL DEFAULT 50,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "rotationMode" "OfferRotationMode" NOT NULL DEFAULT 'PRIORITY',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_vaults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_dashboards" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "linkAccountId" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clicks" (
    "id" TEXT NOT NULL,
    "linkAccountId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clickSignature" TEXT,
    "ipAddress" TEXT NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "isp" TEXT,
    "browser" TEXT,
    "browserVersion" TEXT,
    "os" TEXT,
    "deviceType" TEXT,
    "deviceBrand" TEXT,
    "screenResolution" TEXT,
    "referrer" TEXT,
    "language" TEXT,
    "timeZone" TEXT,
    "userAgent" TEXT,
    "isUnique" BOOLEAN NOT NULL DEFAULT false,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "botScore" DOUBLE PRECISION DEFAULT 0,
    "botReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_stats" (
    "id" TEXT NOT NULL,
    "linkAccountId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
    "botClicks" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geo_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_analytics" (
    "id" TEXT NOT NULL,
    "linkAccountId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
    "botClicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hourly_analytics" (
    "id" TEXT NOT NULL,
    "linkAccountId" TEXT NOT NULL,
    "hour" TIMESTAMP(3) NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
    "botClicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "hourly_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "browser_stats" (
    "id" TEXT NOT NULL,
    "linkAccountId" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
    "botClicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "browser_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_stats" (
    "id" TEXT NOT NULL,
    "linkAccountId" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
    "botClicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "os_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_stats" (
    "id" TEXT NOT NULL,
    "linkAccountId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
    "botClicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "device_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrer_stats" (
    "id" TEXT NOT NULL,
    "linkAccountId" TEXT NOT NULL,
    "referrer" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
    "botClicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "referrer_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_page_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "htmlContent" TEXT NOT NULL,
    "customText" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "landing_page_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_pages" (
    "id" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "trackingUrl" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#06B6D4',
    "secondaryColor" TEXT NOT NULL DEFAULT '#8B5CF6',
    "buttonText" TEXT NOT NULL DEFAULT 'Get Started',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "link_accounts_slug_key" ON "link_accounts"("slug");

-- CreateIndex
CREATE INDEX "link_accounts_userId_offerGroupName_idx" ON "link_accounts"("userId", "offerGroupName");

-- CreateIndex
CREATE UNIQUE INDEX "link_accounts_slug_customDomainId_key" ON "link_accounts"("slug", "customDomainId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_domains_domain_key" ON "custom_domains"("domain");

-- CreateIndex
CREATE INDEX "offer_vaults_userId_country_isActive_idx" ON "offer_vaults"("userId", "country", "isActive");

-- CreateIndex
CREATE INDEX "offer_vaults_userId_groupName_isActive_idx" ON "offer_vaults"("userId", "groupName", "isActive");

-- CreateIndex
CREATE INDEX "offer_vaults_userId_isGlobal_isActive_idx" ON "offer_vaults"("userId", "isGlobal", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "public_dashboards_publicId_key" ON "public_dashboards"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "public_dashboards_linkAccountId_key" ON "public_dashboards"("linkAccountId");

-- CreateIndex
CREATE INDEX "clicks_linkAccountId_idx" ON "clicks"("linkAccountId");

-- CreateIndex
CREATE INDEX "clicks_userAgent_idx" ON "clicks"("userAgent");

-- CreateIndex
CREATE INDEX "clicks_clickSignature_idx" ON "clicks"("clickSignature");

-- CreateIndex
CREATE INDEX "clicks_clickSignature_createdAt_idx" ON "clicks"("clickSignature", "createdAt");

-- CreateIndex
CREATE INDEX "clicks_ipAddress_createdAt_idx" ON "clicks"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "clicks_userAgent_createdAt_idx" ON "clicks"("userAgent", "createdAt");

-- CreateIndex
CREATE INDEX "clicks_linkAccountId_clickSignature_createdAt_idx" ON "clicks"("linkAccountId", "clickSignature", "createdAt");

-- CreateIndex
CREATE INDEX "clicks_timestamp_idx" ON "clicks"("timestamp");

-- CreateIndex
CREATE INDEX "clicks_country_idx" ON "clicks"("country");

-- CreateIndex
CREATE INDEX "clicks_isUnique_idx" ON "clicks"("isUnique");

-- CreateIndex
CREATE INDEX "clicks_isBot_idx" ON "clicks"("isBot");

-- CreateIndex
CREATE UNIQUE INDEX "geo_stats_linkAccountId_country_key" ON "geo_stats"("linkAccountId", "country");

-- CreateIndex
CREATE UNIQUE INDEX "daily_analytics_linkAccountId_date_key" ON "daily_analytics"("linkAccountId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "hourly_analytics_linkAccountId_hour_key" ON "hourly_analytics"("linkAccountId", "hour");

-- CreateIndex
CREATE UNIQUE INDEX "browser_stats_linkAccountId_browser_key" ON "browser_stats"("linkAccountId", "browser");

-- CreateIndex
CREATE UNIQUE INDEX "os_stats_linkAccountId_os_key" ON "os_stats"("linkAccountId", "os");

-- CreateIndex
CREATE UNIQUE INDEX "device_stats_linkAccountId_deviceType_key" ON "device_stats"("linkAccountId", "deviceType");

-- CreateIndex
CREATE UNIQUE INDEX "referrer_stats_linkAccountId_referrer_key" ON "referrer_stats"("linkAccountId", "referrer");

-- CreateIndex
CREATE INDEX "landing_page_templates_isActive_idx" ON "landing_page_templates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "landing_pages_subdomain_key" ON "landing_pages"("subdomain");

-- CreateIndex
CREATE INDEX "landing_pages_userId_idx" ON "landing_pages"("userId");

-- CreateIndex
CREATE INDEX "landing_pages_subdomain_idx" ON "landing_pages"("subdomain");

-- CreateIndex
CREATE INDEX "landing_pages_isPublished_idx" ON "landing_pages"("isPublished");

-- AddForeignKey
ALTER TABLE "link_accounts" ADD CONSTRAINT "link_accounts_customDomainId_fkey" FOREIGN KEY ("customDomainId") REFERENCES "custom_domains"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_accounts" ADD CONSTRAINT "link_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_vaults" ADD CONSTRAINT "offer_vaults_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_dashboards" ADD CONSTRAINT "public_dashboards_linkAccountId_fkey" FOREIGN KEY ("linkAccountId") REFERENCES "link_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_linkAccountId_fkey" FOREIGN KEY ("linkAccountId") REFERENCES "link_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_stats" ADD CONSTRAINT "geo_stats_linkAccountId_fkey" FOREIGN KEY ("linkAccountId") REFERENCES "link_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_analytics" ADD CONSTRAINT "daily_analytics_linkAccountId_fkey" FOREIGN KEY ("linkAccountId") REFERENCES "link_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hourly_analytics" ADD CONSTRAINT "hourly_analytics_linkAccountId_fkey" FOREIGN KEY ("linkAccountId") REFERENCES "link_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "browser_stats" ADD CONSTRAINT "browser_stats_linkAccountId_fkey" FOREIGN KEY ("linkAccountId") REFERENCES "link_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_stats" ADD CONSTRAINT "os_stats_linkAccountId_fkey" FOREIGN KEY ("linkAccountId") REFERENCES "link_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_stats" ADD CONSTRAINT "device_stats_linkAccountId_fkey" FOREIGN KEY ("linkAccountId") REFERENCES "link_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrer_stats" ADD CONSTRAINT "referrer_stats_linkAccountId_fkey" FOREIGN KEY ("linkAccountId") REFERENCES "link_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_page_templates" ADD CONSTRAINT "landing_page_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "landing_page_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
