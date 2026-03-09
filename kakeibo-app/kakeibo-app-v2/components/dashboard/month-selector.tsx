"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonth } from "@/lib/utils/format";
import { addMonthsToMonth } from "@/lib/utils/date";

interface MonthSelectorProps {
  selectedMonth: string;
}

export function MonthSelector({ selectedMonth }: MonthSelectorProps) {
  const router = useRouter();

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
      <span className="font-mono text-sm tracking-[0.15em] min-w-[140px] text-center text-slime-cyan-bright border border-accent/25 rounded bg-accent/10 px-4 py-1.5">
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
