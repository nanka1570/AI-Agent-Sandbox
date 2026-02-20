import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MonthlyChart } from "@/components/charts/monthly-chart";
import { CategoryChart } from "@/components/charts/category-chart";
import { StatusBadge } from "@/components/status-badge";

// recharts の ResponsiveContainer はテスト環境で幅0になるため、モックする
vi.mock("recharts", async () => {
  const actual = await vi.importActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 400, height: 300 }}>{children}</div>
    ),
  };
});

vi.mock("@/lib/actions/payment", () => ({
  updatePaymentStatus: vi.fn().mockResolvedValue({ success: true }),
}));

describe("ダッシュボード コンポーネント", () => {
  // CT-DB-001: サマリーカード表示（ユーティリティ関数のテストで代替）
  it("formatCurrencyが正しく動作する", async () => {
    const { formatCurrency } = await import("@/lib/utils");
    expect(formatCurrency(250000)).toBe("¥250,000");
  });

  // CT-DB-002: 内訳表示（ユーティリティ関数のテストで代替）
  it("calcStatusBreakdownが正しく計算する", async () => {
    const { calcStatusBreakdown } = await import("@/lib/dashboard");
    const payments = [
      { amount: 30000, status: "unconfirmed", creditCardId: "c1", creditCard: { name: "A" } },
      { amount: 50000, status: "confirmed", creditCardId: "c1", creditCard: { name: "A" } },
      { amount: 20000, status: "paid", creditCardId: "c2", creditCard: { name: "B" } },
    ];
    const breakdown = calcStatusBreakdown(payments);
    expect(breakdown.confirmed).toBe(50000);
    expect(breakdown.unconfirmed).toBe(30000);
    expect(breakdown.paid).toBe(20000);
  });

  // CT-DB-003: 金額フォーマット確認
  it("金額が¥250,000とフォーマットされる", async () => {
    const { formatCurrency } = await import("@/lib/utils");
    expect(formatCurrency(0)).toBe("¥0");
    expect(formatCurrency(1000000)).toBe("¥1,000,000");
  });

  // CT-DB-004: 棒グラフレンダリング
  it("MonthlyChartがエラーなく表示される", () => {
    const data = [
      { month: "1月", total: 50000 },
      { month: "2月", total: 80000 },
    ];
    const { container } = render(<MonthlyChart data={data} />);
    expect(container.querySelector(".recharts-wrapper")).toBeInTheDocument();
  });

  // CT-DB-005: 円グラフレンダリング
  it("CategoryChartがエラーなく表示される", () => {
    const data = [
      { name: "楽天カード", total: 50000 },
      { name: "三井住友", total: 30000 },
    ];
    const { container } = render(<CategoryChart data={data} />);
    expect(container.querySelector(".recharts-wrapper")).toBeInTheDocument();
  });

  // CT-DB-006: 支払い予定一覧表示（StatusBadge コンポーネント）
  it("StatusBadgeがreadonly=trueで表示される", () => {
    render(<StatusBadge paymentId="p1" status="unconfirmed" readonly />);
    const badge = screen.getByText("未確定");
    expect(badge).toBeInTheDocument();
    expect(badge).toBeDisabled();
  });

  // CT-DB-007: データなし時の表示（CategoryChart に空状態あり）
  it("CategoryChartにデータなし時のメッセージ表示", () => {
    render(<CategoryChart data={[]} />);
    expect(screen.getByText("データがありません")).toBeInTheDocument();
  });
});
