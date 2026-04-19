import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT user_id FROM payments LIMIT 5;`,
  );
  if (!users.length) {
    console.log("既存ユーザーが見つかりません");
    return;
  }
  const userId = users[0].user_id;
  console.log(`=== 検証対象 userId: ${userId} ===`);

  const salaries = await prisma.salary.findMany({
    where: { userId },
    orderBy: { month: "desc" },
    take: 3,
  });
  console.log("\n=== Salary (v3 Prisma Client で取得・最新 3 件) ===");
  console.log(salaries);

  const cards = await prisma.creditCard.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
    take: 3,
  });
  console.log("\n=== CreditCard (最初 3 件・account_id は null) ===");
  console.log(cards.map((c) => ({ id: c.id, name: c.name, accountId: c.accountId })));

  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { usageDate: "desc" },
    take: 3,
    select: {
      id: true,
      month: true,
      usageDate: true,
      amount: true,
      status: true,
      accountId: true,
      creditCardId: true,
    },
  });
  console.log("\n=== Payment (v3 の usageDate でソート・最新 3 件) ===");
  console.log(payments);

  const accounts = await prisma.account.findMany({ where: { userId } });
  console.log("\n=== Account (v3 新規テーブル・初期状態 0 件) ===");
  console.log(accounts);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
