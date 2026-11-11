-- Unique numeric publisher ID (Affmine-style #63460)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "publisherNumber" INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS "users_publisherNumber_key" ON "users"("publisherNumber");

-- Persist dismissible "Offer request approved" banners per publisher application
ALTER TABLE "offer_applications" ADD COLUMN IF NOT EXISTS "noticeDismissed" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "offer_applications_publisherId_status_noticeDismissed_idx"
  ON "offer_applications"("publisherId", "status", "noticeDismissed");
