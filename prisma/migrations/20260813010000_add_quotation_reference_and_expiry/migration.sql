-- Migration: add_quotation_reference_and_expiry
-- Adds referenceNumber and expiresAt to Quotation table to support human-readable references
-- (e.g. QTN-YYYY-NNNNNN) and validity checking during customer accept/reject.

ALTER TABLE "Quotation" ADD COLUMN "referenceNumber" TEXT;
ALTER TABLE "Quotation" ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Quotation_referenceNumber_key" ON "Quotation"("referenceNumber");
