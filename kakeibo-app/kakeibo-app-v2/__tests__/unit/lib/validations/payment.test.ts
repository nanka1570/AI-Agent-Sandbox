import { describe, it, expect } from "vitest";
import { paymentSchema, bulkRegisterSchema } from "@/lib/validations/payment";

describe("paymentSchema", () => {
  it("正常値でバリデーションが成功する", () => {
    const result = paymentSchema.safeParse({
      creditCardId: "card-1",
      month: "2026-03",
      amount: 10000,
    });
    expect(result.success).toBe(true);
  });

  it("空のcreditCardIdでエラーになる", () => {
    const result = paymentSchema.safeParse({
      creditCardId: "",
      month: "2026-03",
      amount: 10000,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find(
        (issue) => issue.path[0] === "creditCardId"
      );
      expect(error?.message).toBe("カードを選択してください");
    }
  });

  it("不正な月形式でエラーになる", () => {
    const result = paymentSchema.safeParse({
      creditCardId: "card-1",
      month: "2026-13",
      amount: 10000,
    });
    expect(result.success).toBe(false);
  });

  it("金額0でエラーになる", () => {
    const result = paymentSchema.safeParse({
      creditCardId: "card-1",
      month: "2026-03",
      amount: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find(
        (issue) => issue.path[0] === "amount"
      );
      expect(error?.message).toBe("1円以上で入力してください");
    }
  });
});

describe("bulkRegisterSchema", () => {
  it("正常値でバリデーションが成功する", () => {
    const result = bulkRegisterSchema.safeParse({
      creditCardId: "card-1",
      month: "2026-03",
      totalAmount: 50000,
      items: [
        { categoryId: "cat-1", amount: 30000 },
        { categoryId: null, amount: 20000 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("空のitemsでエラーになる", () => {
    const result = bulkRegisterSchema.safeParse({
      creditCardId: "card-1",
      month: "2026-03",
      totalAmount: 50000,
      items: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find(
        (issue) => issue.path[0] === "items"
      );
      expect(error?.message).toBe("1件以上の振り分けが必要です");
    }
  });

  it("items内の金額がマイナスでエラーになる", () => {
    const result = bulkRegisterSchema.safeParse({
      creditCardId: "card-1",
      month: "2026-03",
      totalAmount: 50000,
      items: [{ categoryId: "cat-1", amount: -1 }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find(
        (issue) => issue.path[0] === "items"
      );
      expect(error).toBeDefined();
    }
  });
});
