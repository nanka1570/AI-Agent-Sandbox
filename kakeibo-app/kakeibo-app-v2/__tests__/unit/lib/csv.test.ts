import { describe, it, expect } from "vitest";
import { generatePaymentCSV } from "@/lib/utils/csv";

describe("generatePaymentCSV", () => {
  const BOM = "\uFEFF";
  const header = "利用月,カード名,金額,カテゴリ,ステータス,メモ";

  it("空配列の場合はBOM付きヘッダーのみ返す", () => {
    const result = generatePaymentCSV([]);
    expect(result).toBe(BOM + header + "\n");
  });

  it("通常のデータを正しいCSV行に変換する", () => {
    const payments = [
      {
        month: "2026-03",
        creditCard: { name: "楽天カード" },
        amount: 15000,
        category: { name: "食費" },
        status: "confirmed",
        memo: "スーパーでの買い物",
      },
    ];
    const result = generatePaymentCSV(payments);
    const lines = result.split("\n");
    // BOM + ヘッダー
    expect(lines[0]).toBe(BOM + header);
    // データ行
    expect(lines[1]).toBe("2026-03,楽天カード,15000,食費,確定,スーパーでの買い物");
  });

  it("カテゴリがnullの場合は空文字にする", () => {
    const payments = [
      {
        month: "2026-01",
        creditCard: { name: "VISAカード" },
        amount: 5000,
        category: null,
        status: "unconfirmed",
        memo: null,
      },
    ];
    const result = generatePaymentCSV(payments);
    const lines = result.split("\n");
    expect(lines[1]).toBe("2026-01,VISAカード,5000,,未確定,");
  });

  it("カンマを含むデータはダブルクォートで囲む", () => {
    const payments = [
      {
        month: "2026-02",
        creditCard: { name: "VISA,ゴールド" },
        amount: 10000,
        category: { name: "食費" },
        status: "paid",
        memo: "備考,あり",
      },
    ];
    const result = generatePaymentCSV(payments);
    const lines = result.split("\n");
    expect(lines[1]).toContain('"VISA,ゴールド"');
    expect(lines[1]).toContain('"備考,あり"');
  });

  it("ダブルクォートを含むデータは二重エスケープする", () => {
    const payments = [
      {
        month: "2026-04",
        creditCard: { name: 'カード"特別"' },
        amount: 3000,
        category: { name: "娯楽" },
        status: "paid",
        memo: null,
      },
    ];
    const result = generatePaymentCSV(payments);
    const lines = result.split("\n");
    expect(lines[1]).toContain('"カード""特別"""');
  });

  it("メモがnullの場合は空文字にする", () => {
    const payments = [
      {
        month: "2026-05",
        creditCard: { name: "JCBカード" },
        amount: 8000,
        category: { name: "通信費" },
        status: "confirmed",
        memo: null,
      },
    ];
    const result = generatePaymentCSV(payments);
    const lines = result.split("\n");
    // 末尾がカンマ（メモが空文字）
    expect(lines[1]).toMatch(/,$/);
  });

  it("複数行のデータを正しく出力する", () => {
    const payments = [
      {
        month: "2026-01",
        creditCard: { name: "カードA" },
        amount: 1000,
        category: { name: "食費" },
        status: "paid",
        memo: null,
      },
      {
        month: "2026-02",
        creditCard: { name: "カードB" },
        amount: 2000,
        category: { name: "交通費" },
        status: "unconfirmed",
        memo: "テスト",
      },
    ];
    const result = generatePaymentCSV(payments);
    const lines = result.split("\n");
    // BOM + ヘッダー + 2データ行
    expect(lines).toHaveLength(3);
  });
});
