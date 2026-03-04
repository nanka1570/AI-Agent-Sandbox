export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(amount);
}

export function formatMonth(month: string): string {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) return month;
  return `${match[1]}年${parseInt(match[2])}月`;
}
