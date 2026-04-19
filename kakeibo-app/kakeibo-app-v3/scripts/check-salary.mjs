import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });
const cols = await prisma.$queryRawUnsafe(
  `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='salaries' ORDER BY ordinal_position;`
);
console.log("salaries columns:", cols.map(c => c.column_name));
const users = await prisma.$queryRawUnsafe(`SELECT DISTINCT user_id FROM salaries;`);
console.log("salary user_ids:", users);
const paymentUsers = await prisma.$queryRawUnsafe(`SELECT DISTINCT user_id FROM payments LIMIT 3;`);
console.log("payment user_ids:", paymentUsers);
await prisma.$disconnect();
