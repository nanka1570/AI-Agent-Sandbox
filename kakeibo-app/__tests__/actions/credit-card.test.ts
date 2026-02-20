import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCreditCard, updateCreditCard, deleteCreditCard } from "@/lib/actions/credit-card";

// Prisma と revalidatePath をモック
vi.mock("@/lib/db", () => ({
  prisma: {
    creditCard: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue("user-1"),
}));

// モックされた prisma を取得
import { prisma } from "@/lib/db";
const mockCreate = vi.mocked(prisma.creditCard.create);
const mockFindUnique = vi.mocked(prisma.creditCard.findUnique);
const mockUpdate = vi.mocked(prisma.creditCard.update);
const mockDelete = vi.mocked(prisma.creditCard.delete);

// テスト用のダミーデータ
const mockCard = {
  id: "card-1",
  userId: "user-1",
  name: "楽天カード",
  closingDay: 31,
  paymentDay: 27,
  paymentMonthOffset: 0,
  memo: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createCreditCard", () => {
  // UT-CC-001: 正常登録
  it("正常な入力で登録成功", async () => {
    mockCreate.mockResolvedValue(mockCard);
    const result = await createCreditCard({ name: "楽天カード", closingDay: 31, paymentDay: 27, paymentMonthOffset: 0 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("楽天カード");
  });

  // UT-CC-002: 名前空
  it("名前空で登録エラー", async () => {
    const result = await createCreditCard({ name: "", closingDay: 31, paymentDay: 27 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("必須");
  });

  // UT-CC-003: 名前51文字
  it("名前51文字で登録エラー", async () => {
    const result = await createCreditCard({ name: "a".repeat(51), closingDay: 31, paymentDay: 27 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("50文字以内");
  });

  // UT-CC-004: closingDay 0
  it("closingDay 0で登録エラー", async () => {
    const result = await createCreditCard({ name: "テスト", closingDay: 0, paymentDay: 27 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("1〜31");
  });

  // UT-CC-005: closingDay 32
  it("closingDay 32で登録エラー", async () => {
    const result = await createCreditCard({ name: "テスト", closingDay: 32, paymentDay: 27 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("1〜31");
  });

  // UT-CC-006: paymentDay 0
  it("paymentDay 0で登録エラー", async () => {
    const result = await createCreditCard({ name: "テスト", closingDay: 31, paymentDay: 0 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("1〜31");
  });
});

describe("updateCreditCard", () => {
  // UT-CC-007: 正常編集
  it("正常な入力で編集成功", async () => {
    mockFindUnique.mockResolvedValue(mockCard);
    mockUpdate.mockResolvedValue({ ...mockCard, name: "更新名" });
    const result = await updateCreditCard("card-1", { name: "更新名", closingDay: 15, paymentDay: 10, paymentMonthOffset: 0 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("更新名");
  });

  // UT-CC-008: 存在しないID
  it("存在しないIDで編集エラー", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await updateCreditCard("nonexistent", { name: "テスト", closingDay: 15, paymentDay: 10, paymentMonthOffset: 0 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("見つかりません");
  });
});

describe("deleteCreditCard", () => {
  // UT-CC-009: 正常削除
  it("正常に削除成功", async () => {
    mockFindUnique.mockResolvedValue(mockCard);
    mockDelete.mockResolvedValue(mockCard);
    const result = await deleteCreditCard("card-1");
    expect(result.success).toBe(true);
  });

  // UT-CC-010: 存在しないID
  it("存在しないIDで削除エラー", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await deleteCreditCard("nonexistent");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("見つかりません");
  });
});
