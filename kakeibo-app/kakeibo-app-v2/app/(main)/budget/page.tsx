export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/supabase/server";
import { CategoryList } from "@/components/categories/category-list";

/**
 * カテゴリ管理ページ（読み取り専用 Server Component）
 * カテゴリが0件の場合は CategoryList 側でデフォルト作成ボタンを表示する
 */
export default async function BudgetPage() {
  const userId = await getAuthUserId();

  // カテゴリを取得
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
  });

  // 「その他」を sortOrder に関わらず末尾にソート
  const sorted = [...categories].sort((a, b) => {
    if (a.isDefault && a.name === "その他") return 1;
    if (b.isDefault && b.name === "その他") return -1;
    return a.sortOrder - b.sortOrder;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">カテゴリ管理</h1>
        <p className="text-sm text-muted-foreground">
          支払いの分類に使用するカテゴリを管理します
        </p>
      </div>
      <CategoryList categories={sorted} />
    </div>
  );
}
