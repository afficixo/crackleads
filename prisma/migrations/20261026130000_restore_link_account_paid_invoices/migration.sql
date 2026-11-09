UPDATE "invoices" AS invoice
SET "isPaid" = TRUE
WHERE invoice."isPaid" = FALSE
  AND invoice."paymentReference" IS NOT NULL
  AND btrim(invoice."paymentReference") <> ''
  AND EXISTS (
    SELECT 1
    FROM "manager_payout_invoices" AS manager_payout_invoice
    INNER JOIN "manager_payouts" AS manager_payout
      ON manager_payout.id = manager_payout_invoice."payoutId"
    WHERE manager_payout_invoice."invoiceId" = invoice.id
      AND manager_payout."isPaid" = TRUE
  );
