import { describe, it, expect } from "vitest";
import {
  calculatePaymentDate,
  calculateConfirmationDate,
} from "@/lib/utils/payment-date";

describe("calculatePaymentDate", () => {
  it("翌月27日の支払い日を算出する", () => {
    const result = calculatePaymentDate("2026-01", 1, 27);
    expect(result).toEqual(new Date(2026, 1, 27));
  });

  it("翌々月10日の支払い日を算出する", () => {
    const result = calculatePaymentDate("2026-01", 2, 10);
    expect(result).toEqual(new Date(2026, 2, 10));
  });

  it("当月15日の支払い日を算出する（オフセット0）", () => {
    const result = calculatePaymentDate("2026-01", 0, 15);
    expect(result).toEqual(new Date(2026, 0, 15));
  });

  it("末日を超える支払い日は丸められる（31日→2月28日）", () => {
    const result = calculatePaymentDate("2026-01", 1, 31);
    // 翌月が2月なので28日に丸められる
    expect(result).toEqual(new Date(2026, 1, 28));
  });

  it("年をまたぐ支払い日を正しく算出する", () => {
    const result = calculatePaymentDate("2026-12", 1, 10);
    expect(result).toEqual(new Date(2027, 0, 10));
  });
});

describe("calculateConfirmationDate", () => {
  it("翌月15日の確定日を算出する", () => {
    const result = calculateConfirmationDate("2026-01", 1, 15);
    expect(result).toEqual(new Date(2026, 1, 15));
  });

  it("当月20日の確定日を算出する（オフセット0）", () => {
    const result = calculateConfirmationDate("2026-03", 0, 20);
    expect(result).toEqual(new Date(2026, 2, 20));
  });

  it("末日を超える確定日は丸められる", () => {
    const result = calculateConfirmationDate("2026-01", 1, 31);
    expect(result).toEqual(new Date(2026, 1, 28));
  });
});
