import { describe, it, expect } from "vitest";
import {
  creditCardSchema,
  salarySchema,
  paymentSchema,
  paymentStatusSchema,
} from "@/types";

describe("creditCardSchema", () => {
  // UT-VL-001: 正常値
  it("正常な入力でparse成功", () => {
    const result = creditCardSchema.safeParse({
      name: "テスト",
      closingDay: 15,
      paymentDay: 10,
      paymentMonthOffset: 0,
    });
    expect(result.success).toBe(true);
  });

  // UT-VL-002: 名前空
  it("名前空でparse失敗", () => {
    const result = creditCardSchema.safeParse({
      name: "",
      closingDay: 15,
      paymentDay: 10,
      paymentMonthOffset: 0,
    });
    expect(result.success).toBe(false);
  });

  // UT-VL-003: 名前50文字（境界値OK）
  it("名前50文字でparse成功", () => {
    const result = creditCardSchema.safeParse({
      name: "a".repeat(50),
      closingDay: 15,
      paymentDay: 10,
      paymentMonthOffset: 0,
    });
    expect(result.success).toBe(true);
  });

  // UT-VL-004: 名前51文字（境界値NG）
  it("名前51文字でparse失敗", () => {
    const result = creditCardSchema.safeParse({
      name: "a".repeat(51),
      closingDay: 15,
      paymentDay: 10,
      paymentMonthOffset: 0,
    });
    expect(result.success).toBe(false);
  });

  // UT-VL-013: paymentMonthOffset 正常値（0,1,2）
  it("paymentMonthOffset 0/1/2でparse成功", () => {
    for (const offset of [0, 1, 2]) {
      const result = creditCardSchema.safeParse({
        name: "テスト",
        closingDay: 15,
        paymentDay: 10,
        paymentMonthOffset: offset,
      });
      expect(result.success).toBe(true);
    }
  });

  // UT-VL-014: paymentMonthOffset 不正値（3）
  it("paymentMonthOffset 3でparse失敗", () => {
    const result = creditCardSchema.safeParse({
      name: "テスト",
      closingDay: 15,
      paymentDay: 10,
      paymentMonthOffset: 3,
    });
    expect(result.success).toBe(false);
  });
});

describe("salarySchema", () => {
  const validInput = { month: "2026-02", payDay: 25, amount: 250000 };

  // UT-VL-005: 正常値
  it("正常な入力でparse成功", () => {
    const result = salarySchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  // UT-VL-006: month不正
  it("month形式不正でparse失敗", () => {
    const result = salarySchema.safeParse({ ...validInput, month: "2026/02" });
    expect(result.success).toBe(false);
  });

  // UT-VL-007: amount最小値（1円）
  it("amount 1円でparse成功", () => {
    const result = salarySchema.safeParse({ ...validInput, amount: 1 });
    expect(result.success).toBe(true);
  });

  // UT-VL-008: amount 0
  it("amount 0でparse失敗", () => {
    const result = salarySchema.safeParse({ ...validInput, amount: 0 });
    expect(result.success).toBe(false);
  });
});

describe("paymentSchema", () => {
  const validInput = { creditCardId: "xxx", month: "2026-02", amount: 50000 };

  // UT-VL-009: 正常値
  it("正常な入力でparse成功", () => {
    const result = paymentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  // UT-VL-010: creditCardId空
  it("creditCardId空でparse失敗", () => {
    const result = paymentSchema.safeParse({ ...validInput, creditCardId: "" });
    expect(result.success).toBe(false);
  });
});

describe("paymentStatusSchema", () => {
  // UT-VL-011: 正常値（3つ全て）
  it("unconfirmed/confirmed/paidでparse成功", () => {
    expect(paymentStatusSchema.safeParse("unconfirmed").success).toBe(true);
    expect(paymentStatusSchema.safeParse("confirmed").success).toBe(true);
    expect(paymentStatusSchema.safeParse("paid").success).toBe(true);
  });

  // UT-VL-012: 不正値
  it("不正な値でparse失敗", () => {
    expect(paymentStatusSchema.safeParse("invalid").success).toBe(false);
  });
});
