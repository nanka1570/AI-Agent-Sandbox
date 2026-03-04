import { Skeleton } from "@/components/ui/skeleton";

/**
 * 支払い管理ページのローディング UI
 */
export default function PaymentsLoading() {
  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* 操作ボタン群 */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-28" />
      </div>

      {/* フィルター */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[200px]" />
      </div>

      {/* テーブル */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-full rounded-md" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}
