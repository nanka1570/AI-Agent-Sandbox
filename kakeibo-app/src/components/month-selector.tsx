"use client";

import { useRouter } from "next/navigation";
import { format, subMonths } from "date-fns";
import { formatMonth } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  currentMonth: string;
  basePath: string; // 例: "/" or "/payments"
};

// 直近12ヶ月分の選択肢を生成
function generateMonthOptions(): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(now, i);
    const value = format(date, "yyyy-MM");
    return { value, label: formatMonth(value) };
  });
}

export function MonthSelector({ currentMonth, basePath }: Props) {
  const router = useRouter();
  const monthOptions = generateMonthOptions();

  function handleChange(month: string) {
    router.push(`${basePath}?month=${month}`);
  }

  return (
    <Select value={currentMonth} onValueChange={(v) => handleChange(v)}>
      <SelectTrigger className="w-[160px] border-2 border-border bg-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {monthOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
