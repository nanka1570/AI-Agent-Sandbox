import { describe, it, expect } from "vitest";
import {
  calcTotalSalary,
  calcTotalPayment,
  calcStatusBreakdown,
  calcBalance,
  calcConfirmedBalance,
  calcMonthlyData,
  calcCategoryData,
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
