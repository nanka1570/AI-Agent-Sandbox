import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tables = await prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;`,
  );
  console.log("=== Tables ===");
  console.log(tables);

  const paymentCols = await prisma.$queryRawUnsafe(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema='public' AND table_name='payments'
     ORDER BY ordinal_position;`,
  );
  console.log("\n=== payments columns (post migration) ===");
  console.log(paymentCols);

  const backfillCheck = await prisma.$queryRawUnsafe(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(usage_date)::int AS with_usage_date,
       COUNT(*) FILTER (WHERE usage_date = (month || '-01')::DATE)::int AS correctly_backfilled
     FROM payments;`,
  );
  console.log("\n=== payments backfill check ===");
  console.log(backfillCheck);

  const rowCounts = await prisma.$queryRawUnsafe(
    `SELECT
       (SELECT COUNT(*)::int FROM accounts) AS accounts,
       (SELECT COUNT(*)::int FROM credit_card_statements) AS statements,
       (SELECT COUNT(*)::int FROM balance_histories) AS balance_histories,
       (SELECT COUNT(*)::int FROM salaries) AS salaries,
       (SELECT COUNT(*)::int FROM credit_cards) AS credit_cards,
       (SELECT COUNT(*)::int FROM payments) AS payments,
       (SELECT COUNT(*)::int FROM categories) AS categories;`,
  );
  console.log("\n=== row counts (post migration) ===");
  console.log(rowCounts);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
