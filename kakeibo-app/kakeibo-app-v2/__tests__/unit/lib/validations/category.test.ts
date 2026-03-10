import { describe, it, expect } from "vitest";
import { categorySchema } from "@/lib/validations/category";

describe("categorySchema", () => {
  it("正常値でバリデーションが成功する", () => {
    const result = categorySchema.safeParse({
      name: "食費",
      color: "#FF6384",
    });
    expect(result.success).toBe(true);
  });

  describe("name", () => {
    it("空文字でエラーになる", () => {
      const result = categorySchema.safeParse({
        name: "",
        color: "#FF6384",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find(
          (issue) => issue.path[0] === "name"
        );
        expect(error?.message).toBe("カテゴリ名を入力してください");
      }
    });

    it("31文字でエラーになる", () => {
      const result = categorySchema.safeParse({
        name: "あ".repeat(31),
        color: "#FF6384",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find(
          (issue) => issue.path[0] === "name"
        );
        expect(error?.message).toBe("30文字以内で入力してください");
      }
    });
  });

  describe("color", () => {
    it("#FFFFFF は成功する", () => {
      const result = categorySchema.safeParse({
        name: "食費",
        color: "#FFFFFF",
      });
      expect(result.success).toBe(true);
    });

    it("#fff（3桁省略形）はエラーになる", () => {
      const result = categorySchema.safeParse({
        name: "食費",
        color: "#fff",
      });
      expect(result.success).toBe(false);
    });

    it("#なしの 'FF6384' はエラーになる", () => {
      const result = categorySchema.safeParse({
        name: "食費",
        color: "FF6384",
      });
      expect(result.success).toBe(false);
    });

    it("不正な文字を含む '#GGGGGG' はエラーになる", () => {
      const result = categorySchema.safeParse({
        name: "食費",
        color: "#GGGGGG",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find(
          (issue) => issue.path[0] === "color"
        );
        expect(error?.message).toBe(
          "有効なカラーコード（例: #FF6384）を入力してください"
        );
      }
    });
  });
});
