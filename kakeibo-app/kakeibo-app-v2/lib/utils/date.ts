import { toZonedTime } from "date-fns-tz";
import { format, endOfMonth, addMonths } from "date-fns";
import { TIMEZONE } from "@/lib/constants";

export function getNowJST(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

export function getTodayJST(): string {
  return format(getNowJST(), "yyyy-MM-dd");
}

export function getCurrentMonthJST(): string {
  return format(getNowJST(), "yyyy-MM");
}

export function resolveDay(day: number, year: number, month: number): number {
  if (day === 32) {
    const lastDay = endOfMonth(new Date(year, month - 1)).getDate();
    return lastDay;
  }
  const lastDay = endOfMonth(new Date(year, month - 1)).getDate();
  return Math.min(day, lastDay);
}

export function getDateFromMonthAndDay(month: string, day: number): Date {
  const [year, m] = month.split("-").map(Number);
  const resolvedDay = resolveDay(day, year, m);
  return new Date(year, m - 1, resolvedDay);
}

export function addMonthsToMonth(month: string, offset: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = addMonths(new Date(year, m - 1, 1), offset);
  return format(date, "yyyy-MM");
}

export function getAdjacentMonths(month: string, range: number[]): string[] {
  return range.map((offset) => addMonthsToMonth(month, offset));
}
