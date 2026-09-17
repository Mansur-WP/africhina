-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "authorizationUrl" TEXT,
ALTER COLUMN "status" SET DEFAULT 'INITIATED';
