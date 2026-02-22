-- AlterTable
ALTER TABLE "CreditCard" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Salary" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
