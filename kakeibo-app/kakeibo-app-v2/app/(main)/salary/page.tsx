export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { getRecentAmounts } from "@/lib/actions/salary-actions";
import { SalaryList } from "@/components/salary/salary-list";

/**
 * 手取り管理ページ
 * 月別の手取り額を一覧表示し、追加・編集・削除を行う
 */
export default async function SalaryPage() {
  const userId = await getAuthUserId();

  // 手取りデータと金額プリセットを並列取得
  const [salaries, recentAmounts] = await Promise.all([
    prisma.salary.findMany({
      where: { userId },
      orderBy: { sortOrder: "desc" },
    }),
    getRecentAmounts(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">手取り管理</h1>
        <p className="text-sm text-muted-foreground">
          月別の手取り額を管理します
        </p>
      </div>
      <SalaryList salaries={salaries} recentAmounts={recentAmounts} />
    </div>
  );
}
