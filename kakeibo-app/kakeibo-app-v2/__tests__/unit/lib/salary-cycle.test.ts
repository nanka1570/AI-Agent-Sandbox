import { describe, it, expect } from "vitest";
import {
  calculateSalaryCycle,
  isDateInCycle,
} from "@/lib/utils/salary-cycle";

describe("calculateSalaryCycle", () => {
  it("payDay=25の場合、当月25日から翌月24日まで", () => {
    const cycle = calculateSalaryCycle(25, "2026-02");
    expect(cycle.start).toEqual(new Date(2026, 1, 25));
    expect(cycle.end).toEqual(new Date(2026, 2, 24));
  });

  it("payDay=1の場合、当月1日から当月末日まで", () => {
    const cycle = calculateSalaryCycle(1, "2026-03");
    expect(cycle.start).toEqual(new Date(2026, 2, 1));
    // endOfMonth は時刻を 23:59:59.999 に設定する
    expect(cycle.end.getFullYear()).toBe(2026);
    expect(cycle.end.getMonth()).toBe(2);
    expect(cycle.end.getDate()).toBe(31);
  });

  it("payDay=32（末日）の場合、当月末日から翌月末日まで", () => {
    const cycle = calculateSalaryCycle(32, "2026-02");
    // 2026年2月は28日まで
    expect(cycle.start).toEqual(new Date(2026, 1, 28));
    // 翌月（3月）の末日（endOfMonth は 23:59:59.999）
    expect(cycle.end.getFullYear()).toBe(2026);
    expect(cycle.end.getMonth()).toBe(2);
    expect(cycle.end.getDate()).toBe(31);
  });

  it("payDay=31で2月の場合、28日に丸められる", () => {
    const cycle = calculateSalaryCycle(31, "2026-02");
    expect(cycle.start).toEqual(new Date(2026, 1, 28));
  });

  it("payDay=15の場合、当月15日から翌月14日まで", () => {
    const cycle = calculateSalaryCycle(15, "2026-06");
    expect(cycle.start).toEqual(new Date(2026, 5, 15));
    expect(cycle.end).toEqual(new Date(2026, 6, 14));
  });

  it("payDay=1で12月の場合、12月1日から12月31日まで", () => {
    const cycle = calculateSalaryCycle(1, "2026-12");
    expect(cycle.start).toEqual(new Date(2026, 11, 1));
    // endOfMonth は時刻を 23:59:59.999 に設定する
    expect(cycle.end.getFullYear()).toBe(2026);
    expect(cycle.end.getMonth()).toBe(11);
    expect(cycle.end.getDate()).toBe(31);
  });

  it("payDay=25で12月の場合、年をまたいで翌年1月24日まで", () => {
    const cycle = calculateSalaryCycle(25, "2026-12");
    expect(cycle.start).toEqual(new Date(2026, 11, 25));
    expect(cycle.end).toEqual(new Date(2027, 0, 24));
  });
});

describe("isDateInCycle", () => {
  const cycle = calculateSalaryCycle(25, "2026-02");
  // start: 2026-02-25, end: 2026-03-24

  it("サイクル開始日はサイクル内と判定する", () => {
    expect(isDateInCycle(new Date(2026, 1, 25), cycle)).toBe(true);
  });

  it("サイクル終了日はサイクル内と判定する", () => {
    expect(isDateInCycle(new Date(2026, 2, 24), cycle)).toBe(true);
  });

  it("サイクル中間日はサイクル内と判定する", () => {
    expect(isDateInCycle(new Date(2026, 2, 1), cycle)).toBe(true);
  });

  it("サイクル開始日の前日はサイクル外と判定する", () => {
    expect(isDateInCycle(new Date(2026, 1, 24), cycle)).toBe(false);
  });

  it("サイクル終了日の翌日はサイクル外と判定する", () => {
    expect(isDateInCycle(new Date(2026, 2, 25), cycle)).toBe(false);
  });
});
