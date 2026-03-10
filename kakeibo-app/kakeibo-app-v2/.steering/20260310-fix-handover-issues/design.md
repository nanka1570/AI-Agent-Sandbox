# 設計書

## 1. salary 同月重複チェック削除

### 変更対象
- `lib/actions/salary-actions.ts`

### 変更内容
- `createSalary`: 同月の重複チェック（findFirst + if existing）を削除
- `updateSalary`: 同月の重複チェック（findFirst + if existing）を削除
- PRDの Salary sortOrder の定義「同月内に複数レコードがある場合の副次ソートキー」に準拠

### 影響範囲
- salary/page.tsx: 同月複数レコードの表示は月降順 + sortOrder でソート済み → 変更不要
- dashboard.ts: salaryTotal は `salaries.reduce()` で合算済み → 変更不要

## 2. dashboard.ts 資金繰りロジック改善

### 変更対象
- `lib/utils/dashboard.ts` の `buildFundFlow` 関数

### 現在の問題
```
buildFundFlow は全カードの引き落とし日を selectedMonth 基準で計算:
  calculatePaymentDate(selectedMonth, card.paymentMonthOffset, card.paymentDay)

実際: filteredPayments には複数の利用月の支払いが混在
  例: paymentMonthOffset=2 のカードで
    利用月 2026-01 → 引き落とし 2026-03
    利用月 2026-02 → 引き落とし 2026-04
  → selectedMonth=2026-03 基準だと全て 2026-05 と誤算される
```

### 修正方針
1. `groupPaymentsByCard` の結果ではなく、カード × 引き落とし日でグループ化
2. 各支払いの実際の利用月（`payment.month`）から引き落とし日を算出
3. 同一カードでも引き落とし日が異なれば別の FundFlowEntry として表示
4. `CardPaymentGroup` に payments の利用月情報が含まれているため、そこから算出可能

### 実装アプローチ
`buildFundFlow` で cardGroup.payments をさらに引き落とし日でサブグループ化:
```
for each cardGroup:
  payments を引き落とし日ごとにグルーピング
  → Map<実際の引き落とし日string, payments[]>
  for each (paymentDate, paymentsForDate):
    fundFlow.push(...)
```

## 3. category-form.tsx 確認

### 現状
- Controller パターンで `field.value` / `field.onChange` を使用
- color input と text input の両方が同じ Controller の field で制御
- → 二重バインド問題は解消済み。確認のみ。

## 4. テストファイル作成

### テスト対象（architecture.md セクション9.3 準拠）

```
__tests__/
├── unit/
│   ├── lib/
│   │   ├── salary-cycle.test.ts     # 給料サイクル計算
│   │   ├── status.test.ts           # ステータス判定
│   │   ├── payment-date.test.ts     # 引き落とし日算出
│   │   ├── date.test.ts             # 日付ユーティリティ
│   │   ├── format.test.ts           # 金額フォーマット
│   │   ├── csv.test.ts              # CSV生成
│   │   ├── report.test.ts           # レポート集計
│   │   └── validations/
│   │       ├── auth.test.ts         # 認証バリデーション
│   │       ├── salary.test.ts       # 手取りバリデーション
│   │       ├── payment.test.ts      # 支払いバリデーション
│   │       ├── credit-card.test.ts  # クレカバリデーション
│   │       ├── budget.test.ts       # 予算バリデーション
│   │       └── category.test.ts     # カテゴリバリデーション
```

### テスト戦略
- 純粋なロジック関数とバリデーションスキーマに絞る（DB不要）
- 境界値テスト重視（末日=32、paymentMonthOffset=0/1/2、負数、空文字等）
- 日本語テストラベル（CLAUDE.md規約）

## 5. マイグレーション確認

既存マイグレーション（0001_init, 0002_add_budget_model, 0_v1_to_v2_rename）とスキーマの整合性を確認するのみ。

## 実装の順序

1. salary 同月重複チェック削除（単純な削除、影響小）
2. dashboard.ts 資金繰りロジック改善（ロジック変更）
3. category-form.tsx 確認（確認のみ）
4. マイグレーション確認（確認のみ）
5. テストファイル作成（テスト対象のコード理解が必要なため最後）
6. 品質チェック（型チェック・リント・ビルド・テスト）
