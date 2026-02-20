/**
 * 認証ページ用レイアウト
 * BottomNav とヘッダーナビを表示しない、中央揃えのシンプルなレイアウト
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {children}
    </div>
  );
}
