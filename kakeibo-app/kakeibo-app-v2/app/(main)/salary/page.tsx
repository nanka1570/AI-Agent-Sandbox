export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { SalaryList } from "@/components/salary/salary-list";
import { RECENT_AMOUNTS_TAKE, RECENT_AMOUNTS_MAX } from "@/lib/constants";

/**
 * 手取り管理ページ
 * 月別の手取り額を一覧表示し、追加・編集・削除を行う
 */
export default async function SalaryPage() {
  const userId = await getAuthUserId();

  const salaries = await prisma.salary.findMany({
    where: { userId },
    orderBy: { sortOrder: "desc" },
  });

  // 取得済みデータからプリセット金額を算出（追加DBクエリ不要）
  const recentAmounts = [
    ...new Set(salaries.slice(0, RECENT_AMOUNTS_TAKE).map((s) => s.amount)),
  ].slice(0, RECENT_AMOUNTS_MAX);

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
