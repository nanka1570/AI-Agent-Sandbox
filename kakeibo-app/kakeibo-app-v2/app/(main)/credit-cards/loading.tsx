import { Skeleton } from "@/components/ui/skeleton";

/**
 * クレジットカード管理ページのローディング UI
 */
export default function CreditCardsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-10 w-40" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
