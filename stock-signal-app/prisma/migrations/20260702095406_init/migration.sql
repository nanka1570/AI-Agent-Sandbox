-- CreateTable
CREATE TABLE "Stock" (
    "ticker" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "DailyPrice" (
    "ticker" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "open" REAL NOT NULL,
    "high" REAL NOT NULL,
    "low" REAL NOT NULL,
    "close" REAL NOT NULL,
    "adjClose" REAL NOT NULL,
    "volume" REAL NOT NULL,

    PRIMARY KEY ("ticker", "date"),
    CONSTRAINT "DailyPrice_ticker_fkey" FOREIGN KEY ("ticker") REFERENCES "Stock" ("ticker") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fundamental" (
    "ticker" TEXT NOT NULL PRIMARY KEY,
    "per" REAL,
    "forwardPer" REAL,
    "peg" REAL,
    "revenueGrowth" REAL,
    "profitMargin" REAL,
    "fetchedAt" DATETIME NOT NULL,
    CONSTRAINT "Fundamental_ticker_fkey" FOREIGN KEY ("ticker") REFERENCES "Stock" ("ticker") ON DELETE CASCADE ON UPDATE CASCADE
);
