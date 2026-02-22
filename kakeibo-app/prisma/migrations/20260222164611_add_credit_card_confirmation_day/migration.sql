-- AlterTable
ALTER TABLE "CreditCard" ADD COLUMN     "confirmationDay" INTEGER,
ADD COLUMN     "confirmationMonthOffset" INTEGER DEFAULT 0;
