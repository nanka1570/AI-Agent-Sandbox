import { describe, it, expect } from "vitest";
import {
  calculateSalaryCycle,
  isDateInCycle,
} from "@/lib/utils/salary-cycle";

describe("calculateSalaryCycle", () => {
  it("月中給料日（25日）は start=当月25, end=翌月24", () => {
    const { start, end } = calculateSalaryCycle(25, "2026-04");
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(3);
    expect(start.getDate()).toBe(25);
    expect(end.getMonth()).toBe(4);
    expect(end.getDate()).toBe(24);
  });

  it("payDay=1 は start=当月1, end=当月末", () => {
    const { start, end } = calculateSalaryCycle(1, "2026-04");
    expect(start.getMonth()).toBe(3);
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(3);
    expect(end.getDate()).toBe(30);
  });

  it("末日コード32は start=当月末, end=翌月末", () => {
    const { start, end } = calculateSalaryCycle(32, "2026-04");
    expect(start.getMonth()).toBe(3);
    expect(start.getDate()).toBe(30);
    expect(end.getMonth()).toBe(4);
    expect(end.getDate()).toBe(31);
  });

  it("末日コード32で2月をまたぐ: 1月 → start=1/31, end=2/28", () => {
    const { start, end } = calculateSalaryCycle(32, "2026-01");
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(31);
    expect(end.getMonth()).toBe(1);
    expect(end.getDate()).toBe(28);
  });
});

describe("isDateInCycle", () => {
  it("サイクル境界（start, end）はともに包含する", () => {
    const cycle = calculateSalaryCycle(25, "2026-04");
    expect(isDateInCycle(new Date(2026, 3, 25), cycle)).toBe(true);
    expect(isDateInCycle(new Date(2026, 4, 24), cycle)).toBe(true);
  });

  it("サイクル範囲外は false", () => {
    const cycle = calculateSalaryCycle(25, "2026-04");
    expect(isDateInCycle(new Date(2026, 3, 24), cycle)).toBe(false);
    expect(isDateInCycle(new Date(2026, 4, 25), cycle)).toBe(false);
  });
});
