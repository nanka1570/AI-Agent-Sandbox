"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface YearSelectorProps {
  selectedYear: number;
}

export function YearSelector({ selectedYear }: YearSelectorProps) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <Select
      value={String(selectedYear)}
      onValueChange={(value) => router.push(`/reports?year=${value}`)}
    >
      <SelectTrigger className="w-[100px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={String(year)}>
            {year}年
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
