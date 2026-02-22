"use client";

import { useRouter } from "next/navigation";
import { format, subMonths, addMonths } from "date-fns";
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

// 未来3ヶ月 + 今月 + 過去12ヶ月の選択肢を生成（新しい月が上）
function generateMonthOptions(): { value: string; label: string }[] {
  const now = new Date();
  const options: { value: string; label: string }[] = [];

  // 未来3ヶ月（翌月→翌々月→3ヶ月後の順）
  const futureSuffixes = ["来月", "再来月", "3ヶ月後"];
  for (let i = 3; i >= 1; i--) {
    const date = addMonths(now, i);
    const value = format(date, "yyyy-MM");
    options.push({ value, label: `${formatMonth(value)}（${futureSuffixes[i - 1]}）` });
  }
  // 今月
  const currentValue = format(now, "yyyy-MM");
  options.push({ value: currentValue, label: `${formatMonth(currentValue)}（今月）` });
  // 過去12ヶ月
  for (let i = 1; i <= 12; i++) {
    const date = subMonths(now, i);
    const value = format(date, "yyyy-MM");
    options.push({ value, label: formatMonth(value) });
  }
  return options;
}

export function MonthSelector({ currentMonth, basePath }: Props) {
  const router = useRouter();
  const monthOptions = generateMonthOptions();

  function handleChange(month: string) {
    router.push(`${basePath}?month=${month}`);
  }

  return (
    <Select value={currentMonth} onValueChange={(v) => handleChange(v)}>
      <SelectTrigger className="w-[220px] border-2 border-border bg-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
