import { resolveDay, addMonthsToMonth } from "@/lib/utils/date";

export interface SubscriptionLite {
  id: string;
  name: string;
  amount: number;
  source: string;
  creditCardId: string | null;
  accountId: string | null;
  categoryId: string;
  dayOfMonth: number;
  startMonth: string;
  endMonth: string | null;
  installmentTotal: number | null;
  memo: string | null;
}

export interface SubscriptionOverrideLite {
  subscriptionId: string;
  month: string;
  amount: number | null;
  skip: boolean;
  memo: string | null;
}

export interface VirtualOccurrence {
  subscriptionId: string;
  name: string;
  amount: number;
  source: "card" | "account";
  creditCardId: string | null;
  accountId: string | null;
  categoryId: string;
  month: string;
  usageDate: Date;
  memo: string | null;
  overridden: boolean;
  installmentNumber: number | null;
  installmentTotal: number | null;
}

function compareMonth(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function monthsDiff(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

function overrideKey(subscriptionId: string, month: string): string {
  return `${subscriptionId}:${month}`;
}

export function buildOverrideMap(
  overrides: SubscriptionOverrideLite[],
): Map<string, SubscriptionOverrideLite> {
  const map = new Map<string, SubscriptionOverrideLite>();
  for (const o of overrides) {
    map.set(overrideKey(o.subscriptionId, o.month), o);
  }
  return map;
}

export function generateOccurrences(
  sub: SubscriptionLite,
  fromMonth: string,
  toMonth: string,
  overrides?: Map<string, SubscriptionOverrideLite>,
): VirtualOccurrence[] {
  const begin =
    compareMonth(sub.startMonth, fromMonth) >= 0 ? sub.startMonth : fromMonth;
  const hardEnd = sub.endMonth
    ? compareMonth(sub.endMonth, toMonth) <= 0
      ? sub.endMonth
      : toMonth
    : toMonth;
  if (compareMonth(begin, hardEnd) > 0) return [];

  const result: VirtualOccurrence[] = [];
  let cursor = begin;
  while (compareMonth(cursor, hardEnd) <= 0) {
    const ov = overrides?.get(overrideKey(sub.id, cursor));
    if (ov?.skip) {
      cursor = addMonthsToMonth(cursor, 1);
      continue;
    }
    const [y, m] = cursor.split("-").map(Number);
    const day = resolveDay(sub.dayOfMonth, y, m);
    const amount = ov?.amount != null ? ov.amount : sub.amount;
    const memo = ov?.memo ?? sub.memo;
    const installmentNumber = sub.installmentTotal
      ? monthsDiff(sub.startMonth, cursor) + 1
      : null;
    result.push({
      subscriptionId: sub.id,
      name: sub.name,
      amount,
      source: sub.source as "card" | "account",
      creditCardId: sub.creditCardId,
      accountId: sub.accountId,
      categoryId: sub.categoryId,
      month: cursor,
      usageDate: new Date(Date.UTC(y, m - 1, day)),
      memo,
      overridden: ov != null,
      installmentNumber,
      installmentTotal: sub.installmentTotal,
    });
    cursor = addMonthsToMonth(cursor, 1);
  }
  return result;
}

export function generateAllOccurrences(
  subs: SubscriptionLite[],
  fromMonth: string,
  toMonth: string,
  overrides?: SubscriptionOverrideLite[],
): VirtualOccurrence[] {
  const map = overrides ? buildOverrideMap(overrides) : undefined;
  return subs.flatMap((s) => generateOccurrences(s, fromMonth, toMonth, map));
}
