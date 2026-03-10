import { describe, it, expect } from "vitest";
import { budgetSchema } from "@/lib/validations/budget";

describe("budgetSchema", () => {
  it("正常値でバリデーションが成功する", () => {
    const result = budgetSchema.safeParse({
      categoryId: "cat-1",
      month: "2026-03",
      amount: 50000,
    });
    expect(result.success).toBe(true);
  });

  it("空のcategoryIdでエラーになる", () => {
    const result = budgetSchema.safeParse({
      categoryId: "",
      month: "2026-03",
      amount: 50000,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find(
        (issue) => issue.path[0] === "categoryId"
      );
      expect(error?.message).toBe("カテゴリを選択してください");
    }
  });

  it("不正な月形式でエラーになる", () => {
    const result = budgetSchema.safeParse({
      categoryId: "cat-1",
      month: "invalid",
      amount: 50000,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find(
        (issue) => issue.path[0] === "month"
      );
      expect(error?.message).toBe("有効な月を入力してください");
    }
  });

  describe("amount（coerce）", () => {
    it("文字列 '1000' が数値1000に変換されて成功する", () => {
      const result = budgetSchema.safeParse({
        categoryId: "cat-1",
        month: "2026-03",
        amount: "1000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(1000);
      }
    });

    it("0でエラーになる", () => {
      const result = budgetSchema.safeParse({
        categoryId: "cat-1",
        month: "2026-03",
        amount: 0,
      });
      expect(result.success).toBe(false);
    });

    it("1で成功する", () => {
      const result = budgetSchema.safeParse({
        categoryId: "cat-1",
        month: "2026-03",
        amount: 1,
      });
      expect(result.success).toBe(true);
    });
  });
});
