import { HeaderNav } from "@/components/layout/header-nav";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HeaderNav />
      <main className="container mx-auto flex-1 px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
