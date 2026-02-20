import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createPayment,
  updatePayment,
  deletePayment,
  updatePaymentStatus,
} from "@/lib/actions/payment";

vi.mock("@/lib/db", () => ({
  prisma: {
    creditCard: { findUnique: vi.fn() },
    payment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
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
const mockCardFindUnique = vi.mocked(prisma.creditCard.findUnique);
const mockCreate = vi.mocked(prisma.payment.create);
const mockFindUnique = vi.mocked(prisma.payment.findUnique);
const mockUpdate = vi.mocked(prisma.payment.update);
const mockDelete = vi.mocked(prisma.payment.delete);

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

const mockPayment = {
  id: "pay-1",
  userId: "user-1",
  creditCardId: "card-1",
  categoryId: null,
  month: "2026-02",
  amount: 50000,
  status: "unconfirmed",
  memo: null,
  isRecurring: false,
  recurringGroupId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  creditCard: mockCard,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createPayment", () => {
  // UT-PM-001: 正常登録
  it("正常な入力で登録成功（status=unconfirmed）", async () => {
    mockCardFindUnique.mockResolvedValue(mockCard);
    mockCreate.mockResolvedValue(mockPayment as never);
    const result = await createPayment({ creditCardId: "card-1", month: "2026-02", amount: 50000 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("unconfirmed");
  });

  // UT-PM-002: 存在しないクレカID
  it("存在しないクレカIDで登録エラー", async () => {
    mockCardFindUnique.mockResolvedValue(null);
    const result = await createPayment({ creditCardId: "nonexistent", month: "2026-02", amount: 50000 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("クレジットカードが見つかりません");
  });

  // UT-PM-003: amount 0
  it("amount 0で登録エラー", async () => {
    const result = await createPayment({ creditCardId: "card-1", month: "2026-02", amount: 0 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("1円以上");
  });

  // UT-PM-004: month形式不正
  it("month形式不正で登録エラー", async () => {
    const result = await createPayment({ creditCardId: "card-1", month: "2026/02", amount: 50000 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("YYYY-MM");
  });
});

describe("updatePayment", () => {
  // UT-PM-005: 正常編集
  it("正常な入力で編集成功", async () => {
    mockFindUnique.mockResolvedValue(mockPayment as never);
    mockCardFindUnique.mockResolvedValue(mockCard);
    mockUpdate.mockResolvedValue({ ...mockPayment, amount: 60000 } as never);
    const result = await updatePayment("pay-1", { creditCardId: "card-1", month: "2026-03", amount: 60000 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(60000);
  });

  // UT-PM-006: 存在しないID
  it("存在しないIDで編集エラー", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await updatePayment("nonexistent", { creditCardId: "card-1", month: "2026-02", amount: 50000 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("見つかりません");
  });
});

describe("deletePayment", () => {
  // UT-PM-007: 正常削除
  it("正常に削除成功", async () => {
    mockFindUnique.mockResolvedValue(mockPayment as never);
    mockDelete.mockResolvedValue(mockPayment as never);
    const result = await deletePayment("pay-1");
    expect(result.success).toBe(true);
  });

  // UT-PM-008: 存在しないID
  it("存在しないIDで削除エラー", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await deletePayment("nonexistent");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("見つかりません");
  });
});

describe("updatePaymentStatus", () => {
  // UT-PM-009: unconfirmed → confirmed
  it("unconfirmed → confirmedに遷移成功", async () => {
    mockFindUnique.mockResolvedValue({ ...mockPayment, status: "unconfirmed" } as never);
    mockUpdate.mockResolvedValue({ ...mockPayment, status: "confirmed" } as never);
    const result = await updatePaymentStatus("pay-1");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("confirmed");
  });

  // UT-PM-010: confirmed → paid
  it("confirmed → paidに遷移成功", async () => {
    mockFindUnique.mockResolvedValue({ ...mockPayment, status: "confirmed" } as never);
    mockUpdate.mockResolvedValue({ ...mockPayment, status: "paid" } as never);
    const result = await updatePaymentStatus("pay-1");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("paid");
  });

  // UT-PM-011: paid → unconfirmed（循環型に変更済み）
  it("paid → unconfirmedに遷移成功", async () => {
    mockFindUnique.mockResolvedValue({ ...mockPayment, status: "paid" } as never);
    mockUpdate.mockResolvedValue({ ...mockPayment, status: "unconfirmed" } as never);
    const result = await updatePaymentStatus("pay-1");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("unconfirmed");
  });

  // UT-PM-012: 存在しないID
  it("存在しないIDでステータス変更エラー", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await updatePaymentStatus("nonexistent");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("見つかりません");
  });
});
