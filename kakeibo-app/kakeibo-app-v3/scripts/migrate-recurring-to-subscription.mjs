/**
 * recurringGroupId で繋がっていた Payment 群を Subscription 1 レコードに統合するスクリプト。
 *
 * 実行:
 *   node scripts/migrate-recurring-to-subscription.mjs           # dry-run (既定)
 *   node scripts/migrate-recurring-to-subscription.mjs --apply   # 実際に書き込む
 *
 * ルール:
 *   - 各 recurringGroupId について、所属 Payment からカード/口座/カテゴリ/金額/メモを引き継ぐ
 *   - dayOfMonth = グループ内の最初の usageDate の日
 *   - startMonth = グループ内の最小 month
 *   - endMonth   = グループ内の最大 month（有限契約として扱う）
 *   - Subscription 作成後、当月以降の Payment 行を削除（仮想表示に切替）
 *   - 過去月の Payment 行は履歴として残す（recurringGroupId は null に戻す）
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const APPLY = process.argv.includes("--apply");

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function getCurrentMonthJST() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

async function main() {
  const groups = await prisma.payment.groupBy({
    by: ["recurringGroupId", "userId"],
    where: { recurringGroupId: { not: null } },
    _count: { _all: true },
  });

  console.log(
    `対象 recurringGroupId 数: ${groups.length}（${APPLY ? "APPLY" : "DRY-RUN"}）`,
  );

  const currentMonth = getCurrentMonthJST();

  let created = 0;
  let deletedPayments = 0;
  let unlinkedPayments = 0;

  for (const g of groups) {
    if (!g.recurringGroupId) continue;
    const payments = await prisma.payment.findMany({
      where: { recurringGroupId: g.recurringGroupId, userId: g.userId },
      orderBy: { usageDate: "asc" },
      select: {
        id: true,
        userId: true,
        usageDate: true,
        month: true,
        amount: true,
        categoryId: true,
        creditCardId: true,
        accountId: true,
        memo: true,
      },
    });
    if (payments.length === 0) continue;

    const first = payments[0];
    const months = payments.map((p) => p.month).sort();
    const startMonth = months[0];
    const endMonth = months[months.length - 1];
    const source = first.creditCardId ? "card" : "account";
    const dayOfMonth = first.usageDate.getUTCDate();

    const amounts = new Set(payments.map((p) => p.amount));
    const allSameAmount = amounts.size === 1;

    const category = await prisma.category.findUnique({
      where: { id: first.categoryId },
      select: { name: true },
    });

    const name =
      (first.memo && first.memo.trim()) ||
      (category ? `${category.name}（定期）` : "定期支払");

    console.log(
      `  - group=${g.recurringGroupId.slice(0, 8)}… user=${g.userId.slice(0, 8)}… ${payments.length}件 ` +
        `${startMonth}〜${endMonth} day=${dayOfMonth} 金額=${first.amount}${allSameAmount ? "" : " (不揃い)"}`,
    );

    if (!APPLY) continue;

    const sub = await prisma.subscription.create({
      data: {
        userId: g.userId,
        name,
        amount: first.amount,
        source,
        creditCardId: first.creditCardId,
        accountId: first.accountId,
        categoryId: first.categoryId,
        dayOfMonth,
        startMonth,
        endMonth,
        memo: first.memo,
      },
    });
    created += 1;

    if (!allSameAmount) {
      for (const p of payments) {
        if (p.amount !== first.amount) {
          await prisma.subscriptionOverride.upsert({
            where: {
              subscriptionId_month: {
                subscriptionId: sub.id,
                month: p.month,
              },
            },
            create: {
              userId: g.userId,
              subscriptionId: sub.id,
              month: p.month,
              amount: p.amount,
              skip: false,
              memo: null,
            },
            update: {
              amount: p.amount,
              skip: false,
            },
          });
        }
      }
    }

    const futureIds = payments
      .filter((p) => p.month >= currentMonth)
      .map((p) => p.id);
    const pastIds = payments
      .filter((p) => p.month < currentMonth)
      .map((p) => p.id);

    if (futureIds.length > 0) {
      const r = await prisma.payment.deleteMany({
        where: { id: { in: futureIds }, userId: g.userId },
      });
      deletedPayments += r.count;
    }
    if (pastIds.length > 0) {
      const r = await prisma.payment.updateMany({
        where: { id: { in: pastIds }, userId: g.userId },
        data: { recurringGroupId: null, isRecurring: false },
      });
      unlinkedPayments += r.count;
    }
  }

  console.log("\n=== 結果 ===");
  console.log(`  Subscription 作成: ${created}`);
  console.log(`  Payment 削除（当月以降）: ${deletedPayments}`);
  console.log(`  Payment 解除（過去月）: ${unlinkedPayments}`);
  if (!APPLY) {
    console.log("\n※ dry-run です。適用するには --apply を付けて再実行してください。");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
