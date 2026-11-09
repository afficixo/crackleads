ALTER TABLE "users"
ADD COLUMN "referralCode" TEXT,
ADD COLUMN "referredById" TEXT;

UPDATE "users"
SET "referralCode" = UPPER(SUBSTRING(MD5("id") FROM 1 FOR 16))
WHERE "role" = 'MANAGER';

CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");
CREATE INDEX "users_referredById_idx" ON "users"("referredById");

ALTER TABLE "users"
ADD CONSTRAINT "users_referredById_fkey"
FOREIGN KEY ("referredById") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "referral_commissions" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "sourcePayoutId" TEXT,
    "paidWithPayoutId" TEXT,
    "publisherPayoutAmount" DOUBLE PRECISION NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_commissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "referral_commissions_invoiceId_key" ON "referral_commissions"("invoiceId");
CREATE INDEX "referral_commissions_referrerId_paidAt_idx" ON "referral_commissions"("referrerId", "paidAt");
CREATE INDEX "referral_commissions_referredUserId_createdAt_idx" ON "referral_commissions"("referredUserId", "createdAt");

ALTER TABLE "referral_commissions"
ADD CONSTRAINT "referral_commissions_referrerId_fkey"
FOREIGN KEY ("referrerId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "referral_commissions_referredUserId_fkey"
FOREIGN KEY ("referredUserId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "referral_commissions_invoiceId_fkey"
FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id")
ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "referral_commissions_sourcePayoutId_fkey"
FOREIGN KEY ("sourcePayoutId") REFERENCES "manager_payouts"("id")
ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "referral_commissions_paidWithPayoutId_fkey"
FOREIGN KEY ("paidWithPayoutId") REFERENCES "manager_payouts"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
