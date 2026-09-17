-- CreateEnum
CREATE TYPE "StockReservationStatus" AS ENUM ('NONE', 'ACTIVE', 'COMMITTED', 'RELEASED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "stockReservationCommittedAt" TIMESTAMP(3),
ADD COLUMN     "stockReservationExpiresAt" TIMESTAMP(3),
ADD COLUMN     "stockReservationReleasedAt" TIMESTAMP(3),
ADD COLUMN     "stockReservationStatus" "StockReservationStatus" NOT NULL DEFAULT 'NONE';
