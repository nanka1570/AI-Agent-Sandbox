import { getAuthUserId } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CategoryList } from "@/components/categories/category-list";

export default async function CategoriesPage() {
  const userId = await getAuthUserId();
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
      sortOrder: true,
      isDefault: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">カテゴリ</h1>
        <p className="text-sm text-muted-foreground">
          支払いや予算で使用するカテゴリを管理します。
        </p>
      </div>
      <CategoryList categories={categories} />
    </div>
  );
}
