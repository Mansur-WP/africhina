-- Extend quotations with explicit financial components and lifecycle timestamps.
-- Existing price values represented the complete quotation amount, so the
-- column is renamed to total and copied into productCost. Other components
-- start at zero to preserve every existing quotation without inventing data.

ALTER TYPE "QuotationStatus" ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE "QuotationStatus" ADD VALUE IF NOT EXISTS 'sent';

ALTER TABLE "Quotation" RENAME COLUMN "price" TO "total";

ALTER TABLE "Quotation"
  ADD COLUMN "productCost" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "chinaShippingCost" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "inspectionCost" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "internationalFreightCost" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "customsCost" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "serviceFee" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "otherCharges" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "sentAt" TIMESTAMP(3),
  ADD COLUMN "acceptedAt" TIMESTAMP(3),
  ADD COLUMN "rejectedAt" TIMESTAMP(3);

UPDATE "Quotation"
SET "productCost" = "total"
WHERE "total" IS NOT NULL;

ALTER TABLE "Quotation"
  ALTER COLUMN "productCost" DROP DEFAULT,
  ALTER COLUMN "chinaShippingCost" DROP DEFAULT,
  ALTER COLUMN "inspectionCost" DROP DEFAULT,
  ALTER COLUMN "internationalFreightCost" DROP DEFAULT,
  ALTER COLUMN "customsCost" DROP DEFAULT,
  ALTER COLUMN "serviceFee" DROP DEFAULT,
  ALTER COLUMN "otherCharges" DROP DEFAULT;

CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");
CREATE INDEX "Quotation_expiresAt_idx" ON "Quotation"("expiresAt");
