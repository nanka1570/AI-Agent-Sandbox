import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const UC_ID = "cmo0cwk27000104l3kn5zwktv";
const card = await prisma.creditCard.findUnique({ where: { id: UC_ID } });
console.log(card);
await prisma.$disconnect();
