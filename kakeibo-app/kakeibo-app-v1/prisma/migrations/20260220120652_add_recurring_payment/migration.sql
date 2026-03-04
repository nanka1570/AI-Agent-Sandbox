-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurringGroupId" TEXT;
