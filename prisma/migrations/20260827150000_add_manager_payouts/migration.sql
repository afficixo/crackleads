CREATE TABLE "manager_payouts" (
    "id" TEXT NOT NULL,
    "payoutNumber" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "totalEarning" DOUBLE PRECISION NOT NULL,
    "invoiceCount" INTEGER NOT NULL,
    "payoutMethod" TEXT,
    "payoutAccount" TEXT,
    "paymentReference" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manager_payouts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "manager_payout_invoices" (
    "payoutId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,

    CONSTRAINT "manager_payout_invoices_pkey" PRIMARY KEY ("payoutId", "invoiceId")
);

CREATE UNIQUE INDEX "manager_payouts_payoutNumber_key" ON "manager_payouts"("payoutNumber");
CREATE INDEX "manager_payouts_managerId_createdAt_idx" ON "manager_payouts"("managerId", "createdAt");
CREATE UNIQUE INDEX "manager_payout_invoices_invoiceId_key" ON "manager_payout_invoices"("invoiceId");

ALTER TABLE "manager_payouts" ADD CONSTRAINT "manager_payouts_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "manager_payout_invoices" ADD CONSTRAINT "manager_payout_invoices_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "manager_payouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "manager_payout_invoices" ADD CONSTRAINT "manager_payout_invoices_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
