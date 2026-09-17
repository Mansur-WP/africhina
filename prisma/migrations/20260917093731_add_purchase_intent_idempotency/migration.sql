/*
  Warnings:

  - A unique constraint covering the columns `[buyerId,idempotencyKey]` on the table `PurchaseIntent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PurchaseIntent" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseIntent_buyerId_idempotencyKey_key" ON "PurchaseIntent"("buyerId", "idempotencyKey");
