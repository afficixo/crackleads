CREATE TABLE IF NOT EXISTS "short_urls" (
    "id" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "trackingUrl" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "short_urls_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "short_urls_subdomain_key" ON "short_urls"("subdomain");
CREATE INDEX IF NOT EXISTS "short_urls_userId_idx" ON "short_urls"("userId");
CREATE INDEX IF NOT EXISTS "short_urls_isActive_idx" ON "short_urls"("isActive");

INSERT INTO "short_urls" ("id", "subdomain", "trackingUrl", "userId", "totalClicks", "createdAt", "updatedAt")
SELECT "id", "subdomain", "trackingUrl", "userId", "totalClicks", "createdAt", "updatedAt"
FROM "landing_pages"
WHERE "templateId" IN (
    SELECT "id" FROM "landing_page_templates" WHERE "name" = 'URL Shortener'
)
ON CONFLICT ("id") DO NOTHING;

DELETE FROM "landing_pages"
WHERE "templateId" IN (
    SELECT "id" FROM "landing_page_templates" WHERE "name" = 'URL Shortener'
);

DELETE FROM "landing_page_templates" WHERE "name" = 'URL Shortener';