CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "linkAccountId" TEXT NOT NULL,
    "qualifiedClicks" INTEGER NOT NULL,
    "clickRate" DOUBLE PRECISION NOT NULL,
    "totalEarning" DOUBLE PRECISION NOT NULL,
    "payoutMethod" TEXT,
    "payoutAccount" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invoices_invoiceNumber_key" UNIQUE ("invoiceNumber"),
    CONSTRAINT "invoices_linkAccountId_fkey" FOREIGN KEY ("linkAccountId") REFERENCES "link_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "invoices_linkAccountId_createdAt_idx" ON "invoices"("linkAccountId", "createdAt");