import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const UC_ID = "cmo0cwk27000104l3kn5zwktv";
const rows = await prisma.payment.findMany({
  where: { creditCardId: UC_ID },
  orderBy: { usageDate: "asc" },
  select: { usageDate: true, month: true, amount: true, status: true, memo: true },
});
const sumByStatus = {};
for (const r of rows) {
  sumByStatus[r.status] = (sumByStatus[r.status] ?? 0) + r.amount;
}
console.log("status別合計:", sumByStatus);
console.log("\n全件:");
for (const r of rows) {
  console.log(
    `  ${r.usageDate.toISOString().slice(0, 10)} month=${r.month} ¥${r.amount} status=${r.status} ${r.memo?.slice(0, 30)}`,
  );
}
await prisma.$disconnect();
