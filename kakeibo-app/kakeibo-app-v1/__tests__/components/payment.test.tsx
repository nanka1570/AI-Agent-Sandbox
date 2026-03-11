import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PaymentList } from "@/components/payments/payment-list";

vi.mock("@/lib/actions/payment", () => ({
  createPayment: vi.fn(),
  updatePayment: vi.fn(),
  deletePayment: vi.fn(),
  deleteRecurringPayments: vi.fn(),
  updatePaymentStatus: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const mockCard1 = {
  id: "c1",
  userId: "user-1",
  name: "楽天カード",
  closingDay: 31,
  paymentDay: 27,
  paymentMonthOffset: 1,
  confirmationDay: null,
  confirmationMonthOffset: null,
  brand: null,
  memo: null,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCard2 = {
  id: "c2",
  userId: "user-1",
  name: "三井住友カード",
  closingDay: 15,
  paymentDay: 10,
  paymentMonthOffset: 1,
  confirmationDay: null,
  confirmationMonthOffset: null,
  brand: null,
  memo: null,
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCategories = [
  {
    id: "cat-1",
    userId: "user-1",
    name: "食費",
    color: "#FF6384",
    sortOrder: 0,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockPayments = [
  {
    id: "p1",
    userId: "user-1",
    creditCardId: "c1",
    categoryId: null,
    month: "2026-02",
    amount: 50000,
    status: "unconfirmed",
    memo: null,
    isRecurring: false,
    recurringGroupId: null,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    creditCard: mockCard1,
    category: null,
  },
  {
    id: "p2",
    userId: "user-1",
    creditCardId: "c2",
    categoryId: null,
    month: "2026-02",
    amount: 30000,
    status: "confirmed",
    memo: null,
    isRecurring: false,
    recurringGroupId: null,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    creditCard: mockCard2,
    category: null,
  },
];

const creditCards = [mockCard1, mockCard2];

// カテゴリ付き支払いテスト用のモックカード（paymentMonthOffset を含む）
const mockCardWithOffset = {
  id: "c1",
  userId: "user-1",
  name: "楽天カード",
  closingDay: 31,
  paymentDay: 27,
  paymentMonthOffset: 0,
  confirmationDay: null,
  confirmationMonthOffset: null,
  brand: null,
  memo: null,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("PaymentList", () => {
  // CT-PM-001: テーブル一覧表示
  it("支払い2件がテーブルに表示される", () => {
    render(<PaymentList payments={mockPayments} creditCards={creditCards} categories={mockCategories} currentMonth="2026-02" />);
    expect(screen.getByText("楽天カード")).toBeInTheDocument();
    expect(screen.getByText("三井住友カード")).toBeInTheDocument();
  });

  // CT-PM-002: 空状態表示
  it("支払い0件で空状態メッセージ表示", () => {
    render(<PaymentList payments={[]} creditCards={creditCards} categories={mockCategories} currentMonth="2026-02" />);
    expect(screen.getByText("この月に引き落とし予定の支払いはありません")).toBeInTheDocument();
  });

  // CT-PM-003: ステータスバッジ表示（未確定）
  it("未確定バッジが表示される", () => {
    render(<PaymentList payments={mockPayments} creditCards={creditCards} categories={mockCategories} currentMonth="2026-02" />);
    expect(screen.getByText("未確定")).toBeInTheDocument();
  });

  // CT-PM-004: ステータスバッジ表示（確定）
  it("確定バッジが表示される", () => {
    render(<PaymentList payments={mockPayments} creditCards={creditCards} categories={mockCategories} currentMonth="2026-02" />);
    expect(screen.getByText("確定")).toBeInTheDocument();
  });

  // CT-PM-005: ステータスバッジ表示（支払済）
  it("支払い済みバッジが表示される", () => {
    const paidPayments = [{
      ...mockPayments[0],
      status: "paid",
    }];
    render(<PaymentList payments={paidPayments} creditCards={creditCards} categories={mockCategories} currentMonth="2026-02" />);
    expect(screen.getByText("支払い済み")).toBeInTheDocument();
  });

  // CT-PM-006: ステータスバッジクリック
  it("未確定バッジをクリックするとupdatePaymentStatusが呼ばれる", async () => {
    const { updatePaymentStatus } = await import("@/lib/actions/payment");
    const user = userEvent.setup();
    render(<PaymentList payments={mockPayments} creditCards={creditCards} categories={mockCategories} currentMonth="2026-02" />);
    await user.click(screen.getByText("未確定"));
    expect(updatePaymentStatus).toHaveBeenCalledWith("p1");
  });

  // CT-PM-007: 登録フォームのクレカ選択
  it("登録ダイアログが開きクレカ選択欄がある", async () => {
    const user = userEvent.setup();
    render(<PaymentList payments={mockPayments} creditCards={creditCards} categories={mockCategories} currentMonth="2026-02" />);
    await user.click(screen.getByText("+ 新規登録"));
    // ダイアログにクレカ選択のプレースホルダーが表示される
    expect(screen.getByText("カードを選択")).toBeInTheDocument();
  });

  // CT-PM-008: 月別フィルター変更
  it("月フィルターが表示される", () => {
    render(<PaymentList payments={mockPayments} creditCards={creditCards} categories={mockCategories} currentMonth="2026-02" />);
    // 月フィルターに現在月が表示されていること（「今月」サフィックス付き）
    const monthTexts = screen.getAllByText(/2026年02月/);
    expect(monthTexts.length).toBeGreaterThanOrEqual(1);
  });

  // CT-PM-009: カテゴリセルがボタンではなくテキスト表示になっている
  it("カテゴリセルがボタンではなくテキスト表示になっている", () => {
    const paymentsWithCategory = [
      {
        id: "p3",
        userId: "user-1",
        creditCardId: "c1",
        categoryId: "cat-1",
        month: "2026-02",
        amount: 15000,
        status: "unconfirmed",
        memo: null,
        isRecurring: false,
        recurringGroupId: null,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        creditCard: mockCardWithOffset,
        category: mockCategories[0],
      },
    ];
    render(
      <PaymentList
        payments={paymentsWithCategory}
        creditCards={[mockCardWithOffset]}
        categories={mockCategories}
        currentMonth="2026-02"
      />
    );
    // カテゴリ名「食費」がテキストとして表示される
    expect(screen.getByText("食費")).toBeInTheDocument();
    // カテゴリ名でボタンは存在しない（クリック不可）
    expect(screen.queryByRole("button", { name: /食費/ })).toBeNull();
  });

  // CT-PM-010: カテゴリ未設定時に「-」が表示される
  it("カテゴリ未設定の支払いでテーブル内に「-」が表示される", () => {
    const paymentsNoCategory = [
      {
        id: "p4",
        userId: "user-1",
        creditCardId: "c1",
        categoryId: null,
        month: "2026-02",
        amount: 20000,
        status: "unconfirmed",
        memo: null,
        isRecurring: false,
        recurringGroupId: null,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        creditCard: mockCardWithOffset,
        category: null,
      },
    ];
    render(
      <PaymentList
        payments={paymentsNoCategory}
        creditCards={[mockCardWithOffset]}
        categories={mockCategories}
        currentMonth="2026-02"
      />
    );
    // カテゴリ未設定時のプレースホルダー「-」が表示される
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  // CT-PM-011: 月フィルターに「支払い分」が含まれる
  it("月フィルターの選択肢に「支払い分」が含まれる", () => {
    render(
      <PaymentList
        payments={mockPayments}
        creditCards={creditCards}
        categories={mockCategories}
        currentMonth="2026-02"
      />
    );
    // SelectContent は DOM に存在するため、「支払い分」を含むテキストが存在することを確認
    const elements = screen.getAllByText(/支払い分/);
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });
});
