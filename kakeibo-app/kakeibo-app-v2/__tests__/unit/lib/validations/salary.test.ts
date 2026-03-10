import { describe, it, expect } from "vitest";
import { salarySchema } from "@/lib/validations/salary";

describe("salarySchema", () => {
  it("正常値でバリデーションが成功する", () => {
    const result = salarySchema.safeParse({
      month: "2026-03",
      payDay: 25,
      amount: 300000,
    });
    expect(result.success).toBe(true);
  });

  describe("month", () => {
    it("不正な月 '2026-13' でエラーになる", () => {
      const result = salarySchema.safeParse({
        month: "2026-13",
        payDay: 25,
        amount: 300000,
      });
      expect(result.success).toBe(false);
    });

    it("不正な形式 '26-03' でエラーになる", () => {
      const result = salarySchema.safeParse({
        month: "26-03",
        payDay: 25,
        amount: 300000,
      });
      expect(result.success).toBe(false);
    });

    it("不正な文字列 'invalid' でエラーになる", () => {
      const result = salarySchema.safeParse({
        month: "invalid",
        payDay: 25,
        amount: 300000,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("payDay", () => {
    it("0はエラーになる", () => {
      const result = salarySchema.safeParse({
        month: "2026-03",
        payDay: 0,
        amount: 300000,
      });
      expect(result.success).toBe(false);
    });

    it("1は成功する", () => {
      const result = salarySchema.safeParse({
        month: "2026-03",
        payDay: 1,
        amount: 300000,
      });
      expect(result.success).toBe(true);
    });

    it("31は成功する", () => {
      const result = salarySchema.safeParse({
        month: "2026-03",
        payDay: 31,
        amount: 300000,
      });
      expect(result.success).toBe(true);
    });

    it("32（末日）は成功する", () => {
      const result = salarySchema.safeParse({
        month: "2026-03",
        payDay: 32,
        amount: 300000,
      });
      expect(result.success).toBe(true);
    });

    it("33はエラーになる", () => {
      const result = salarySchema.safeParse({
        month: "2026-03",
        payDay: 33,
        amount: 300000,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("amount", () => {
    it("0はエラーになる", () => {
      const result = salarySchema.safeParse({
        month: "2026-03",
        payDay: 25,
        amount: 0,
      });
      expect(result.success).toBe(false);
    });

    it("1は成功する", () => {
      const result = salarySchema.safeParse({
        month: "2026-03",
        payDay: 25,
        amount: 1,
      });
      expect(result.success).toBe(true);
    });

    it("-1はエラーになる", () => {
      const result = salarySchema.safeParse({
        month: "2026-03",
        payDay: 25,
        amount: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("memo", () => {
    it("nullは成功する", () => {
      const result = salarySchema.safeParse({
        month: "2026-03",
        payDay: 25,
        amount: 300000,
        memo: null,
      });
      expect(result.success).toBe(true);
    });

    it("undefinedは成功する", () => {
      const result = salarySchema.safeParse({
        month: "2026-03",
        payDay: 25,
        amount: 300000,
        memo: undefined,
      });
      expect(result.success).toBe(true);
    });

    it("201文字はエラーになる", () => {
      const result = salarySchema.safeParse({
        month: "2026-03",
        payDay: 25,
        amount: 300000,
        memo: "あ".repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });
});
