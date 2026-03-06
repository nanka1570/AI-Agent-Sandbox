"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonth } from "@/lib/utils/format";
import { addMonthsToMonth } from "@/lib/utils/date";

interface MonthSelectorProps {
  selectedMonth: string;
}

/**
 * 月セレクター
 * 前月・次月ボタンで表示月を切り替える
 * URL の searchParams を使って月を管理する
 */
export function MonthSelector({ selectedMonth }: MonthSelectorProps) {
  const router = useRouter();

  /** 月を変更し、URL を更新する */
  const handleMonthChange = (offset: number) => {
    const newMonth = addMonthsToMonth(selectedMonth, offset);
    router.push(`/?month=${newMonth}`);
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleMonthChange(-1)}
        aria-label="前月"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-lg font-bold min-w-[140px] text-center text-foreground border-2 border-foreground rounded-lg px-4 py-1 bg-secondary shadow-[2px_2px_0px_oklch(0.50_0.01_280)]">
        {formatMonth(selectedMonth)}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleMonthChange(1)}
        aria-label="次月"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
