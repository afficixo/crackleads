ALTER TABLE "link_accounts" ADD COLUMN IF NOT EXISTS "payoutMethod" TEXT;
ALTER TABLE "link_accounts" ADD COLUMN IF NOT EXISTS "payoutAccount" TEXT;
ALTER TABLE "link_accounts" ADD COLUMN IF NOT EXISTS "paymentPasswordHash" TEXT;