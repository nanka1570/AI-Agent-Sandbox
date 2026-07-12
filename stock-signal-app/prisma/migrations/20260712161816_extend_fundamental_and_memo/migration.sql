-- AlterTable
ALTER TABLE "Fundamental" ADD COLUMN "currentRatio" REAL;
ALTER TABLE "Fundamental" ADD COLUMN "debtToEquity" REAL;
ALTER TABLE "Fundamental" ADD COLUMN "debtTrend" TEXT;
ALTER TABLE "Fundamental" ADD COLUMN "dividendYield" REAL;
ALTER TABLE "Fundamental" ADD COLUMN "equityRatio" REAL;
ALTER TABLE "Fundamental" ADD COLUMN "fcfNegativeStreak" BOOLEAN;
ALTER TABLE "Fundamental" ADD COLUMN "freeCashflow" REAL;
ALTER TABLE "Fundamental" ADD COLUMN "ocfTrend" TEXT;
ALTER TABLE "Fundamental" ADD COLUMN "operatingCashflow" REAL;
ALTER TABLE "Fundamental" ADD COLUMN "operatingMargin" REAL;
ALTER TABLE "Fundamental" ADD COLUMN "payoutRatio" REAL;
ALTER TABLE "Fundamental" ADD COLUMN "pbr" REAL;
ALTER TABLE "Fundamental" ADD COLUMN "roe" REAL;
ALTER TABLE "Fundamental" ADD COLUMN "sharesTrend" TEXT;
ALTER TABLE "Fundamental" ADD COLUMN "surprises" TEXT;

-- AlterTable
ALTER TABLE "Stock" ADD COLUMN "memo" TEXT;
