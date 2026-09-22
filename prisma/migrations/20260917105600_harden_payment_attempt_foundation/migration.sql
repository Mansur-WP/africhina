-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'INITIATED';
ALTER TYPE "PaymentStatus" ADD VALUE 'PENDING_PROVIDER';
ALTER TYPE "PaymentStatus" ADD VALUE 'VERIFIED';
ALTER TYPE "PaymentStatus" ADD VALUE 'FAILED';
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "Payment"
  ALTER COLUMN "providerRef" DROP NOT NULL,
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "providerEventId" TEXT,
  ADD COLUMN "verificationResult" JSONB,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "failedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerEventId_key" ON "Payment"("providerEventId");
CREATE UNIQUE INDEX "Payment_orderId_idempotencyKey_key" ON "Payment"("orderId", "idempotencyKey");
