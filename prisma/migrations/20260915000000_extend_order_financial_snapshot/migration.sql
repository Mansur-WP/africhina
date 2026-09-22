-- Add immutable quotation financial snapshots to orders and enforce one order per quotation.
-- Existing live data was verified before this migration: there are currently no orders.

ALTER TABLE "Order"
  ADD COLUMN "productCost" INTEGER,
  ADD COLUMN "chinaShippingCost" INTEGER,
  ADD COLUMN "inspectionCost" INTEGER,
  ADD COLUMN "internationalFreightCost" INTEGER,
  ADD COLUMN "customsCost" INTEGER,
  ADD COLUMN "serviceFee" INTEGER,
  ADD COLUMN "otherCharges" INTEGER;

UPDATE "Order" AS o
SET
  "productCost" = q."productCost",
  "chinaShippingCost" = q."chinaShippingCost",
  "inspectionCost" = q."inspectionCost",
  "internationalFreightCost" = q."internationalFreightCost",
  "customsCost" = q."customsCost",
  "serviceFee" = q."serviceFee",
  "otherCharges" = q."otherCharges"
FROM "Quotation" AS q
WHERE o."quotationId" = q."id";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Order"
    WHERE "productCost" IS NULL
      OR "chinaShippingCost" IS NULL
      OR "inspectionCost" IS NULL
      OR "internationalFreightCost" IS NULL
      OR "customsCost" IS NULL
      OR "serviceFee" IS NULL
      OR "otherCharges" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot backfill order financial snapshot: one or more orders have no authoritative quotation values';
  END IF;

  IF EXISTS (
    SELECT "quotationId"
    FROM "Order"
    WHERE "quotationId" IS NOT NULL
    GROUP BY "quotationId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce quotation uniqueness: duplicate quotationId values exist in Order';
  END IF;
END $$;

ALTER TABLE "Order"
  ALTER COLUMN "productCost" SET NOT NULL,
  ALTER COLUMN "chinaShippingCost" SET NOT NULL,
  ALTER COLUMN "inspectionCost" SET NOT NULL,
  ALTER COLUMN "internationalFreightCost" SET NOT NULL,
  ALTER COLUMN "customsCost" SET NOT NULL,
  ALTER COLUMN "serviceFee" SET NOT NULL,
  ALTER COLUMN "otherCharges" SET NOT NULL;

CREATE UNIQUE INDEX "Order_quotationId_key" ON "Order"("quotationId");
