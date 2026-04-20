import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TODAY = new Date("2026-04-20T00:00:00+09:00");

function billingCycleCloseDate(usageDate, closingDay) {
  const y = usageDate.getUTCFullYear();
  const m = usageDate.getUTCMonth();
  const d = usageDate.getUTCDate();
  const closeY = d <= closingDay ? y : y;
  const closeM = d <= closingDay ? m : m + 1;
  const lastDay = new Date(Date.UTC(closeY, closeM + 1, 0)).getUTCDate();
  const day = closingDay === 32 ? lastDay : Math.min(closingDay, lastDay);
  return new Date(Date.UTC(closeY, closeM, day));
}

function paymentDateFromClose(closeDate, paymentMonthOffset, paymentDay) {
  const y = closeDate.getUTCFullYear();
  const m = closeDate.getUTCMonth() + paymentMonthOffset;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const day = paymentDay === 32 ? lastDay : Math.min(paymentDay, lastDay);
  return new Date(Date.UTC(y, m, day));
}

function determineStatus(usageDate, card) {
  const close = billingCycleCloseDate(usageDate, card.closingDay);
  const pay = paymentDateFromClose(
    close,
    card.paymentMonthOffset,
    card.paymentDay,
  );
  if (pay <= TODAY) return { status: "paid", close, pay };
  if (card.confirmationDay != null && card.confirmationMonthOffset != null) {
    const conf = paymentDateFromClose(
      close,
      card.confirmationMonthOffset,
      card.confirmationDay,
    );
    if (conf <= TODAY) return { status: "confirmed", close, pay };
  }
  if (close <= TODAY) return { status: "unconfirmed", close, pay };
  return { status: "unconfirmed", close, pay };
}

async function main() {
  const cards = await prisma.creditCard.findMany({
    select: {
      id: true,
      name: true,
      closingDay: true,
      paymentDay: true,
      paymentMonthOffset: true,
      confirmationDay: true,
      confirmationMonthOffset: true,
    },
  });
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  const UC_ID = "cmo0cwk27000104l3kn5zwktv";
  const payments = await prisma.payment.findMany({
    where: { creditCardId: UC_ID },
    select: {
      id: true,
      usageDate: true,
      month: true,
      amount: true,
      status: true,
      creditCardId: true,
    },
  });

  let changed = 0;
  const updates = [];
  for (const p of payments) {
    const card = cardMap.get(p.creditCardId);
    if (!card) continue;
    const { status, close, pay } = determineStatus(p.usageDate, card);
    if (status !== p.status) {
      updates.push({ p, newStatus: status, close, pay, card });
      changed++;
    }
  }

  console.log(`再計算で status が変わる件数: ${changed}`);
  for (const u of updates.slice(0, 30)) {
    console.log(
      `  ${u.card.name.padEnd(14)} ${u.p.usageDate.toISOString().slice(0, 10)} ¥${u.p.amount} ${u.p.status} → ${u.newStatus} (close=${u.close.toISOString().slice(0, 10)}, pay=${u.pay.toISOString().slice(0, 10)})`,
    );
  }
  if (updates.length > 30) console.log(`  ...ほか ${updates.length - 30} 件`);

  const apply = process.argv.includes("--apply");
  if (!apply) {
    console.log("\n[DRY RUN] 適用するには --apply を付けて再実行");
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const u of updates) {
      await tx.payment.update({
        where: { id: u.p.id },
        data: { status: u.newStatus },
      });
    }
  });
  console.log(`\n適用完了: ${updates.length} 件更新`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
