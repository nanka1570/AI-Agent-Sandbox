import { Skeleton } from "@/components/ui/skeleton";

/**
 * ダッシュボードページのローディング状態
 * サマリーカード3枚 + テーブルの Skeleton UI
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* 月セレクター Skeleton */}
      <div className="flex items-center justify-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <Skeleton className="h-7 w-[140px]" />
        <Skeleton className="h-10 w-10 rounded-md" />
      </div>

      {/* サマリーカード Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>

      {/* ステータス別内訳 Skeleton */}
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* セパレータ */}
      <Skeleton className="h-px w-full" />

      {/* 支払い予定テーブル Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-24" />
        {[1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-14 w-full rounded-lg" />
            <div className="space-y-1 ml-4">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-10 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* セパレータ */}
      <Skeleton className="h-px w-full" />

      {/* 資金繰り Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-20" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
