/**
 * CSV生成ユーティリティ
 * 支払いデータをCSV形式に変換する
 */

interface PaymentForCSV {
  month: string;
  creditCard: { name: string };
  amount: number;
  category: { name: string } | null;
  status: string;
  memo: string | null;
}

/** ステータスの日本語ラベル */
const STATUS_LABELS: Record<string, string> = {
  unconfirmed: "未確定",
  confirmed: "確定",
  paid: "支払済",
};

/**
 * CSV用に値をエスケープする
 * ダブルクォート・カンマ・改行を含む場合はダブルクォートで囲む
 */
function escapeCSV(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * 支払いデータからCSV文字列を生成する
 * BOM付きUTF-8でExcelでの文字化けを防止
 */
export function generatePaymentCSV(payments: PaymentForCSV[]): string {
  const BOM = "\uFEFF";
  const header = "利用月,カード名,金額,カテゴリ,ステータス,メモ";

  const rows = payments.map((p) => {
    const month = p.month;
    const card = escapeCSV(p.creditCard.name);
    const amount = String(p.amount);
    const category = p.category ? escapeCSV(p.category.name) : "";
    const status = STATUS_LABELS[p.status] ?? p.status;
    const memo = p.memo ? escapeCSV(p.memo) : "";
    return `${month},${card},${amount},${category},${status},${memo}`;
  });

  return BOM + header + "\n" + rows.join("\n");
}
