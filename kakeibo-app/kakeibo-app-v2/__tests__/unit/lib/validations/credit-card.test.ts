import { describe, it, expect } from "vitest";
import { creditCardSchema } from "@/lib/validations/credit-card";

describe("creditCardSchema", () => {
  const validFullInput = {
    name: "楽天カード",
    closingDay: 15,
    paymentDay: 10,
    paymentMonthOffset: 1,
    confirmationDay: 20,
    confirmationMonthOffset: 1,
    brand: "VISA",
    memo: "メインカード",
  };

  const validRequiredOnly = {
    name: "楽天カード",
    closingDay: 15,
    paymentDay: 10,
    paymentMonthOffset: 1,
  };

  it("全フィールド指定で成功する", () => {
    const result = creditCardSchema.safeParse(validFullInput);
    expect(result.success).toBe(true);
  });

  it("必須フィールドのみで成功する", () => {
    const result = creditCardSchema.safeParse(validRequiredOnly);
    expect(result.success).toBe(true);
  });

  describe("name", () => {
    it("空文字でエラーになる", () => {
      const result = creditCardSchema.safeParse({
        ...validRequiredOnly,
        name: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find(
          (issue) => issue.path[0] === "name"
        );
        expect(error?.message).toBe("カード名を入力してください");
      }
    });

    it("51文字でエラーになる", () => {
      const result = creditCardSchema.safeParse({
        ...validRequiredOnly,
        name: "あ".repeat(51),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find(
          (issue) => issue.path[0] === "name"
        );
        expect(error?.message).toBe("50文字以内で入力してください");
      }
    });
  });

  describe("closingDay / paymentDay", () => {
    it("closingDay が 0 でエラーになる", () => {
      const result = creditCardSchema.safeParse({
        ...validRequiredOnly,
        closingDay: 0,
      });
      expect(result.success).toBe(false);
    });

    it("closingDay が 32（末日）で成功する", () => {
      const result = creditCardSchema.safeParse({
        ...validRequiredOnly,
        closingDay: 32,
      });
      expect(result.success).toBe(true);
    });

    it("closingDay が 33 でエラーになる", () => {
      const result = creditCardSchema.safeParse({
        ...validRequiredOnly,
        closingDay: 33,
      });
      expect(result.success).toBe(false);
    });

    it("paymentDay が 0 でエラーになる", () => {
      const result = creditCardSchema.safeParse({
        ...validRequiredOnly,
        paymentDay: 0,
      });
      expect(result.success).toBe(false);
    });

    it("paymentDay が 32（末日）で成功する", () => {
      const result = creditCardSchema.safeParse({
        ...validRequiredOnly,
        paymentDay: 32,
      });
      expect(result.success).toBe(true);
    });

    it("paymentDay が 33 でエラーになる", () => {
      const result = creditCardSchema.safeParse({
        ...validRequiredOnly,
        paymentDay: 33,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("paymentMonthOffset", () => {
    it("-1でエラーになる", () => {
      const result = creditCardSchema.safeParse({
        ...validRequiredOnly,
        paymentMonthOffset: -1,
      });
      expect(result.success).toBe(false);
    });

    it("0で成功する", () => {
      const result = creditCardSchema.safeParse({
        ...validRequiredOnly,
        paymentMonthOffset: 0,
      });
      expect(result.success).toBe(true);
    });

    it("2で成功する", () => {
      const result = creditCardSchema.safeParse({
        ...validRequiredOnly,
        paymentMonthOffset: 2,
      });
      expect(result.success).toBe(true);
    });

    it("3でエラーになる", () => {
      const result = creditCardSchema.safeParse({
        ...validRequiredOnly,
        paymentMonthOffset: 3,
      });
      expect(result.success).toBe(false);
    });
  });
});
