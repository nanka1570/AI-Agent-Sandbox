# タスクリスト

## フェーズ1: テスト型エラー修正

- [x] `__tests__/actions/credit-card.test.ts` のモックデータに不足フィールド追加
- [x] `__tests__/actions/payment.test.ts` のモックデータに不足フィールド追加
- [x] `__tests__/actions/salary.test.ts` のモックデータに不足フィールド追加
- [x] `__tests__/components/credit-card.test.tsx` のモックデータに不足フィールド追加
- [x] `__tests__/components/payment.test.tsx` のモックデータに不足フィールド追加
- [x] `__tests__/components/salary.test.tsx` のモックデータに不足フィールド追加
- [x] `npx tsc --noEmit` で `__tests__/` の型エラー 0 件を確認

## フェーズ2: lint warning 解消

- [x] `page.tsx` の `actualSalaryDay` 未使用を修正
- [x] `payment-schedule-table.tsx` の `currentMonth` 未使用を修正
- [x] `bulk-allocation-dialog.tsx` の `format` 未使用 import を削除
- [x] `bulk-allocation-dialog.tsx` の `idx` 未使用を修正
- [x] `payment-list.tsx` の `Payment` 未使用 import を削除
- [x] `quick-input-dialog.tsx` の setState in effect を修正（amount-presets.tsx に変更）
- [x] `npm run lint` で error 0 件・warning 0 件を確認

## フェーズ3: AdSense 本番対応

- [x] `ad-banner.tsx` を環境変数ベースの条件表示に改修
- [x] `layout.tsx` に AdSense スクリプトタグを条件付きで追加
- [x] 環境変数未設定時にプレースホルダー表示されることを確認（ビルドで確認）

## フェーズ4: E2E テスト追加

- [x] `e2e/budget-category-flow.spec.ts` 作成（カテゴリ追加→予算設定→消化率）
- [x] `e2e/reports-page.spec.ts` 作成（レポートページ表示→年セレクター）
- [x] `e2e/legal-pages.spec.ts` 作成（プライバシーポリシー・利用規約表示）
- [x] `e2e/csv-export.spec.ts` 作成（CSV出力ボタン動作）
- [x] 全E2Eテスト実行し pass 確認

## フェーズ5: 最終検証

- [x] `npx tsc --noEmit` 型エラー 0 件
- [x] `npm run lint` error 0 件・warning 0 件
- [x] `npm run build` 成功
- [x] `npm run test` 全テスト pass（101件）
- [x] `npx playwright test --headed --reporter=list` 全 E2E pass（9件）
- [ ] git commit & push

## 実装後の振り返り

（実装完了後に記録）
