/**
 * 既存 Subscription を補完:
 *   - startMonth〜endMonth の月数から installmentTotal を埋める
 *   - name の「（n/N回目）」パターンを除去
 *
 * 実行:
 *   node scripts/fix-existing-subscriptions.mjs          # dry-run
 *   node scripts/fix-existing-subscriptions.mjs --apply  # 適用
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const APPLY = process.argv.includes("--apply");

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function monthsDiff(from, to) {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

async function main() {
  const subs = await prisma.subscription.findMany({
    select: {
      id: true,
      name: true,
      startMonth: true,
      endMonth: true,
      installmentTotal: true,
    },
  });

  console.log(`対象 Subscription: ${subs.length}件（${APPLY ? "APPLY" : "DRY-RUN"}）`);

  let updated = 0;
  for (const s of subs) {
    const cleanedName = s.name
      .replace(/\s*[（(]\s*\d+\s*\/\s*\d+\s*回目\s*[）)]\s*/g, "")
      .trim();
    const newName = cleanedName || s.name;

    let newInstallment = s.installmentTotal;
    if (s.installmentTotal == null && s.endMonth) {
      newInstallment = monthsDiff(s.startMonth, s.endMonth) + 1;
    }

    const nameChanged = newName !== s.name;
    const installmentChanged = newInstallment !== s.installmentTotal;
    if (!nameChanged && !installmentChanged) continue;

    console.log(
      `  - id=${s.id.slice(0, 8)}… ` +
        `name: "${s.name}" → "${newName}" ` +
        `installment: ${s.installmentTotal} → ${newInstallment}`,
    );

    if (APPLY) {
      await prisma.subscription.update({
        where: { id: s.id },
        data: {
          name: newName,
          installmentTotal: newInstallment,
        },
      });
      updated += 1;
    }
  }

  console.log(`\n=== 結果: ${updated} 件更新 ===`);
  if (!APPLY) {
    console.log("※ dry-run です。適用するには --apply を付けて再実行してください。");
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
