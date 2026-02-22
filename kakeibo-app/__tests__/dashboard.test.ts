import { describe, it, expect } from "vitest";
import {
  calcTotalSalary,
  calcTotalPayment,
  calcStatusBreakdown,
  calcBalance,
  calcConfirmedBalance,
  calcMonthlyData,
  calcCategoryData,
  calcCashFlowStatus,
} from "@/lib/dashboard";

// テスト用のダミーデータ
const card1 = { name: "楽天カード" };
const card2 = { name: "三井住友カード" };

const salaries = [
  { amount: 250000 },
  { amount: 50000 },
];

const payments = [
  { amount: 30000, status: "unconfirmed", creditCardId: "c1", creditCard: card1 },
  { amount: 50000, status: "confirmed", creditCardId: "c1", creditCard: card1 },
  { amount: 20000, status: "paid", creditCardId: "c2", creditCard: card2 },
];

describe("ダッシュボード集計ロジック", () => {
  // UT-DB-001: 給料合計計算
  it("給料合計を正しく計算する", () => {
    expect(calcTotalSalary(salaries)).toBe(300000);
  });

  // UT-DB-002: 支払い合計計算（全ステータス）
  it("支払い合計を正しく計算する（全ステータス）", () => {
    expect(calcTotalPayment(payments)).toBe(100000);
  });

  // UT-DB-003: ステータス別内訳計算
  it("ステータス別内訳を正しく計算する", () => {
    const breakdown = calcStatusBreakdown(payments);
    expect(breakdown.unconfirmed).toBe(30000);
    expect(breakdown.confirmed).toBe(50000);
    expect(breakdown.paid).toBe(20000);
  });

  // UT-DB-004: 残額計算
  it("残額を正しく計算する", () => {
    expect(calcBalance(300000, 100000)).toBe(200000);
  });

  // UT-DB-005: 確定分残額計算
  it("確定分残額を正しく計算する", () => {
    // 300000 - (50000 + 20000) = 230000
    expect(calcConfirmedBalance(300000, 50000, 20000)).toBe(230000);
  });

  // UT-DB-006: データなし時の計算
  it("データなし時は全て0", () => {
    expect(calcTotalSalary([])).toBe(0);
    expect(calcTotalPayment([])).toBe(0);
    const breakdown = calcStatusBreakdown([]);
    expect(breakdown.unconfirmed).toBe(0);
    expect(breakdown.confirmed).toBe(0);
    expect(breakdown.paid).toBe(0);
    expect(calcBalance(0, 0)).toBe(0);
  });

  // UT-DB-007: 月別集計（棒グラフ用）
  it("月別集計を正しく計算する", () => {
    const allPayments = [
      { amount: 30000, month: "2026-01" },
      { amount: 50000, month: "2026-01" },
      { amount: 20000, month: "2026-02" },
    ];
    const months = ["2026-01", "2026-02", "2026-03"];
    const result = calcMonthlyData(allPayments, months);
    expect(result[0].total).toBe(80000);  // 1月: 30000 + 50000
    expect(result[1].total).toBe(20000);  // 2月: 20000
    expect(result[2].total).toBe(0);      // 3月: データなし
  });

  // UT-DB-008: クレカ別集計（円グラフ用）
  it("クレカ別集計を正しく計算する", () => {
    const result = calcCategoryData(payments);
    // 楽天カード: 30000 + 50000 = 80000
    // 三井住友カード: 20000
    const rakuten = result.find((r) => r.name === "楽天カード");
    const smbc = result.find((r) => r.name === "三井住友カード");
    expect(rakuten?.total).toBe(80000);
    expect(smbc?.total).toBe(20000);
  });
});

describe("calcCashFlowStatus", () => {
  const payments = [
    {
      id: "p1",
      amount: 30000,
      creditCard: { name: "翌月払いカード", paymentDay: 10, paymentMonthOffset: 1 },
    },
    {
      id: "p2",
      amount: 50000,
      creditCard: { name: "当月払い（給料後）", paymentDay: 27, paymentMonthOffset: 0 },
    },
    {
      id: "p3",
      amount: 20000,
      creditCard: { name: "当月払い（給料前）", paymentDay: 5, paymentMonthOffset: 0 },
    },
  ];

  // 引き落とし月で登録する方式: 給料日と支払日の直接比較で判定
  it("給料日(25) <= 支払日(27) は安全（isSafe=true）", () => {
    const result = calcCashFlowStatus(25, payments);
    const p2 = result.find((r) => r.id === "p2");
    expect(p2?.isSafe).toBe(true);
  });

  it("給料日(25) > 支払日(5) は危険（isSafe=false）", () => {
    const result = calcCashFlowStatus(25, payments);
    const p3 = result.find((r) => r.id === "p3");
    expect(p3?.isSafe).toBe(false);
  });

  it("翌月払いは常に安全（isSafe=true）", () => {
    const result = calcCashFlowStatus(25, payments);
    const p1 = result.find((r) => r.id === "p1");
    expect(p1?.isSafe).toBe(true); // paymentMonthOffset=1 → 常に安全
  });

  it("paymentMonthOffset昇順→paymentDay昇順でソートされる", () => {
    const result = calcCashFlowStatus(25, payments);
    // offset=0: p3(day=5), p2(day=27) → offset=1: p1(day=10)
    expect(result[0].id).toBe("p3");
    expect(result[1].id).toBe("p2");
    expect(result[2].id).toBe("p1");
  });

  it("支払いなしは空配列を返す", () => {
    expect(calcCashFlowStatus(25, [])).toEqual([]);
  });
});
