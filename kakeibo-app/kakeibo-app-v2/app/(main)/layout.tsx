import { HeaderNav } from "@/components/layout/header-nav";
import { BottomNav } from "@/components/layout/bottom-nav";

/**
 * 認証必須エリアのメインレイアウト
 * PC: ヘッダーナビゲーション
 * モバイル: ボトムナビゲーション
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderNav />
      <main className="flex-1 container mx-auto px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
