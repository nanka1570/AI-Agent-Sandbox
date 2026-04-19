import { describe, it, expect } from "vitest";
import {
  calculatePaymentDate,
  calculateConfirmationDate,
} from "@/lib/utils/payment-date";

describe("calculatePaymentDate", () => {
  it("当月支払（オフセット0）は同じ月の paymentDay", () => {
    const d = calculatePaymentDate("2026-04", 0, 10);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3);
    expect(d.getDate()).toBe(10);
  });

  it("翌月支払（オフセット1）は翌月の paymentDay", () => {
    const d = calculatePaymentDate("2026-04", 1, 27);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(27);
  });

  it("末日コード 32 は月末日に丸められる", () => {
    const d = calculatePaymentDate("2026-02", 0, 32);
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(28);
  });
});

describe("calculateConfirmationDate", () => {
  it("翌月オフセット 1 の 5 日", () => {
    const d = calculateConfirmationDate("2026-04", 1, 5);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(5);
  });
});
