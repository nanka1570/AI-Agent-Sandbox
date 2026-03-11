import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSalary, updateSalary, deleteSalary } from "@/lib/actions/salary";

vi.mock("@/lib/db", () => ({
  prisma: {
    salary: {
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

import { prisma } from "@/lib/db";
const mockCreate = vi.mocked(prisma.salary.create);
const mockFindUnique = vi.mocked(prisma.salary.findUnique);
const mockUpdate = vi.mocked(prisma.salary.update);
const mockDelete = vi.mocked(prisma.salary.delete);

const mockSalary = {
  id: "sal-1",
  userId: "user-1",
  month: "2026-02",
  payDay: 25,
  amount: 250000,
  memo: null,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createSalary", () => {
  // UT-SL-001: 正常登録
  it("正常な入力で登録成功", async () => {
    mockCreate.mockResolvedValue(mockSalary);
    const result = await createSalary({ month: "2026-02", payDay: 25, amount: 250000 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(250000);
  });

  // UT-SL-002: month形式不正
  it("month形式不正で登録エラー", async () => {
    const result = await createSalary({ month: "202602", payDay: 25, amount: 250000 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("YYYY-MM");
  });

  // UT-SL-003: month形式不正（日付付き）
  it("month日付付きで登録エラー", async () => {
    const result = await createSalary({ month: "2026-02-01", payDay: 25, amount: 250000 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("YYYY-MM");
  });

  // UT-SL-004: payDay 0
  it("payDay 0で登録エラー", async () => {
    const result = await createSalary({ month: "2026-02", payDay: 0, amount: 250000 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("1〜31");
  });

  // UT-SL-005: payDay 32
  it("payDay 32で登録エラー", async () => {
    const result = await createSalary({ month: "2026-02", payDay: 32, amount: 250000 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("1〜31");
  });

  // UT-SL-006: amount 0
  it("amount 0で登録エラー", async () => {
    const result = await createSalary({ month: "2026-02", payDay: 25, amount: 0 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("1円以上");
  });

  // UT-SL-007: amount 負数
  it("amount負数で登録エラー", async () => {
    const result = await createSalary({ month: "2026-02", payDay: 25, amount: -1 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("1円以上");
  });
});

describe("updateSalary", () => {
  // UT-SL-008: 正常編集
  it("正常な入力で編集成功", async () => {
    mockFindUnique.mockResolvedValue(mockSalary);
    mockUpdate.mockResolvedValue({ ...mockSalary, amount: 260000 });
    const result = await updateSalary("sal-1", { month: "2026-03", payDay: 25, amount: 260000 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(260000);
  });

  // UT-SL-009: 存在しないID
  it("存在しないIDで編集エラー", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await updateSalary("nonexistent", { month: "2026-02", payDay: 25, amount: 250000 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("見つかりません");
  });
});

describe("deleteSalary", () => {
  // UT-SL-010: 正常削除
  it("正常に削除成功", async () => {
    mockFindUnique.mockResolvedValue(mockSalary);
    mockDelete.mockResolvedValue(mockSalary);
    const result = await deleteSalary("sal-1");
    expect(result.success).toBe(true);
  });

  // UT-SL-011: 存在しないID
  it("存在しないIDで削除エラー", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await deleteSalary("nonexistent");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("見つかりません");
  });
});
