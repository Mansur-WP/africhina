-- Migration: add_rfq_reference_number
-- Adds a unique referenceNumber column to the RFQ table so customers see
-- a human-readable business reference (RFQ-YYYY-NNNNNN) instead of a raw CUID.
-- The column is nullable so existing rows are not affected; the application
-- service always sets it at creation time.

ALTER TABLE "RFQ" ADD COLUMN "referenceNumber" TEXT;
CREATE UNIQUE INDEX "RFQ_referenceNumber_key" ON "RFQ"("referenceNumber");
