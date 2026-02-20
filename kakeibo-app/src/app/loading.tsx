import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      {/* タイトルスケルトン */}
      <div className="flex items-center justify-between border-b-4 border-border pb-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-[160px]" />
      </div>

      {/* サマリーカードスケルトン */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="border-2 border-border bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-32" />
          </div>
        ))}
      </div>

      {/* テーブルスケルトン */}
      <div className="mt-8">
        <Skeleton className="mb-4 h-7 w-64" />
        <div className="border-2 border-border bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b-2 border-border px-4 py-3"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
