import { endOfMonth, addMonths, subDays } from "date-fns";
import { resolveDay } from "@/lib/utils/date";
import { LAST_DAY_CODE } from "@/lib/constants";

export interface SalaryCycle {
  start: Date;
  end: Date;
}

export function calculateSalaryCycle(
  payDay: number,
  month: string,
): SalaryCycle {
  const [year, m] = month.split("-").map(Number);

  const resolvedPayDay = resolveDay(payDay, year, m);
  const start = new Date(year, m - 1, resolvedPayDay);

  let end: Date;
  if (payDay === 1) {
    end = endOfMonth(start);
  } else if (payDay === LAST_DAY_CODE) {
    const nextMonth = addMonths(new Date(year, m - 1, 1), 1);
    end = endOfMonth(nextMonth);
  } else {
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
