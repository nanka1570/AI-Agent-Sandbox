export interface StatementDiff {
  paymentsTotal: number;
  confirmedAmount: number;
  diff: number;
  isMatched: boolean;
}

export function calculateStatementDiff(
  paymentsTotal: number,
  confirmedAmount: number,
): StatementDiff {
  const diff = paymentsTotal - confirmedAmount;
  return {
    paymentsTotal,
    confirmedAmount,
    diff,
    isMatched: diff === 0,
  };
}
