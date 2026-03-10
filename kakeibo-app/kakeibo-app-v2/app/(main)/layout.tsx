import { HeaderNav } from "@/components/layout/header-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { getAuthUserId } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createDefaultCategories } from "@/lib/actions/category-actions";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 初回ログイン時にデフォルトカテゴリを自動作成（カテゴリ0件の場合）
  try {
    const userId = await getAuthUserId();
    const categoryCount = await prisma.category.count({ where: { userId } });
    if (categoryCount === 0) {
      const result = await createDefaultCategories();
      if (!result.success) {
        console.error("デフォルトカテゴリの作成に失敗しました:", result.error);
      }
    }
  } catch {
    // 認証エラーはmiddlewareでリダイレクトされるため無視
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="brand-stripe" />
      <HeaderNav />
      <main className="flex-1 container mx-auto px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
