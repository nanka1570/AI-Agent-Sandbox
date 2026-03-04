"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  currentYear: string;
  basePath: string; // 例: "/reports"
};

// 現在年 ± 2年の選択肢を生成
function generateYearOptions(): { value: string; label: string }[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 2 + i;
    return { value: String(year), label: `${year}年` };
  });
}

export function YearSelector({ currentYear, basePath }: Props) {
  const router = useRouter();
  const yearOptions = generateYearOptions();

  function handleChange(year: string) {
    router.push(`${basePath}?year=${year}`);
  }

  return (
    <Select value={currentYear} onValueChange={(v) => handleChange(v)}>
      <SelectTrigger className="w-[140px] border-2 border-border bg-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {yearOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
