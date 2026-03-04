import { endOfMonth, addMonths, subDays } from "date-fns";
import { resolveDay } from "@/lib/utils/date";

export interface SalaryCycle {
  start: Date;
  end: Date;
}

export function calculateSalaryCycle(payDay: number, month: string): SalaryCycle {
  const [year, m] = month.split("-").map(Number);

  const resolvedPayDay = resolveDay(payDay, year, m);
  const start = new Date(year, m - 1, resolvedPayDay);

  let end: Date;
  if (payDay === 1) {
    // payDay=1の場合: 当月1日〜当月末日
    end = endOfMonth(start);
  } else if (payDay === 32) {
    // 末日指定: 翌月末日が終了日
    const nextMonth = addMonths(new Date(year, m - 1, 1), 1);
    end = endOfMonth(nextMonth);
  } else {
    // 一般ルール: 翌月の payDay の前日
    // resolveDay を使わず、JavaScript の Date 自動繰り上げを活用する
    // 例: payDay=30, 翌月が2月 → new Date(2025, 1, 30) → 2025-03-02 → subDays(1) → 2025-03-01
    const nextMonth = addMonths(new Date(year, m - 1, 1), 1);
    const nextYear = nextMonth.getFullYear();
    const nextM = nextMonth.getMonth() + 1;
    end = subDays(new Date(nextYear, nextM - 1, payDay), 1);
  }

  return { start, end };
}

export function isDateInCycle(date: Date, cycle: SalaryCycle): boolean {
  return date >= cycle.start && date <= cycle.end;
}
