# 設計

## 1. テスト型エラー修正

各テストファイルのモックデータに不足しているフィールドを追加。

### 不足フィールド一覧

| モデル | 不足フィールド |
|--------|--------------|
| CreditCard | `sortOrder`, `brand`, `confirmationDay`, `confirmationMonthOffset`, `paymentMonthOffset`（一部） |
| Salary | `sortOrder` |
| Payment | `sortOrder` |

### 対象ファイル

- `__tests__/actions/credit-card.test.ts`
- `__tests__/actions/payment.test.ts`
- `__tests__/actions/salary.test.ts`
- `__tests__/components/credit-card.test.tsx`
- `__tests__/components/payment.test.tsx`
- `__tests__/components/salary.test.tsx`

### アプローチ

各テストファイルにヘルパー関数（mockCreditCard, mockSalary, mockPayment）を定義し、デフォルト値を持たせることで全フィールドを網羅する。

## 2. lint warning 解消

| ファイル | 問題 | 対策 |
|---------|------|------|
| `src/app/(main)/page.tsx:59` | `actualSalaryDay` 未使用 | 変数を削除 or 使用箇所を確認 |
| `src/components/dashboard/payment-schedule-table.tsx:97` | `currentMonth` 未使用 | Props から削除 |
| `src/components/payments/bulk-allocation-dialog.tsx:7` | `format` 未使用 | import 削除 |
| `src/components/payments/bulk-allocation-dialog.tsx:196` | `idx` 未使用 | `_idx` にリネーム or 削除 |
| `src/components/payments/payment-list.tsx:27` | `Payment` 未使用 | import 削除 |
| `src/components/quick-input/quick-input-dialog.tsx:27` | setState in effect | ロジック見直し |

## 3. AdSense 本番対応

- `NEXT_PUBLIC_ADSENSE_CLIENT_ID` 環境変数でクライアントID を管理
- 環境変数が設定されている場合のみ AdSense スクリプトを読み込み、広告を表示
- 未設定の場合はプレースホルダーを表示（開発環境での挙動維持）

## 4. E2E テスト追加

既存E2Eテスト3件（credit-card-payment-flow, salary-dashboard-flow, status-change-flow）に加え、Phase 7-11 の機能をカバーするテストを追加。

### 新規E2Eテスト

| テスト | 対象Phase | 内容 |
|--------|----------|------|
| budget-category-flow | 7 | カテゴリ追加 → 予算設定 → 消化率表示確認 |
| reports-page | 11 | レポートページ表示 → 年セレクター動作確認 |
| legal-pages | 10 | プライバシーポリシー・利用規約ページ表示確認 |
| csv-export | 10 | CSV出力ボタン動作確認 |
