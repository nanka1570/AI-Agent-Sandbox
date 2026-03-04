# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 「実装が複雑すぎるため後回し」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

### 実装可能なタスクのみを計画
- 計画段階で「実装可能なタスク」のみをリストアップ
- 「将来やるかもしれないタスク」は含めない
- 「検討中のタスク」は含めない

### タスクスキップが許可される唯一のケース
以下の技術的理由に該当する場合のみスキップ可能:
- 実装方針の変更により、機能自体が不要になった
- アーキテクチャ変更により、別の実装方法に置き換わった
- 依存関係の変更により、タスクが実行不可能になった

スキップ時は必ず理由を明記:
```markdown
- [x] ~~タスク名~~（実装方針変更により不要: 具体的な技術的理由）
```

### タスクが大きすぎる場合
- タスクを小さなサブタスクに分割
- 分割したサブタスクをこのファイルに追加
- サブタスクを1つずつ完了させる

---

## フェーズ1: プロジェクトスキャフォールディング

- [x] Next.js プロジェクト作成（`npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"）
- [x] 追加依存パッケージのインストール
  - [x] 本番依存: `@prisma/client @supabase/ssr @supabase/supabase-js recharts date-fns date-fns-tz react-hook-form @hookform/resolvers zod sonner @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
  - [x] 開発依存: `prisma vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test`
- [x] shadcn/ui 初期化と必要コンポーネント追加（button, input, select, dialog, card, skeleton, label, table, badge, separator, collapsible, checkbox, textarea）
- [x] 設定ファイルの作成
  - [x] `.prettierrc` を作成
  - [x] `eslint.config.mjs` を更新
  - [x] `vitest.config.ts` を作成
  - [x] `playwright.config.ts` を作成
  - [x] `.env.example` を作成
- [x] Prisma セットアップ
  - [x] `prisma/schema.prisma` を作成（Salary, CreditCard, Payment, Category モデル）
  - [x] `npx prisma generate` を実行
- [x] 共通コード作成
  - [x] `lib/prisma.ts`（Prisma Client シングルトン）
  - [x] `lib/types.ts`（ActionResult<T> 型）
  - [x] `lib/constants.ts`（DEFAULT_CATEGORIES, CARD_BRANDS 等）
  - [x] `lib/utils/format.ts`（formatCurrency）
  - [x] `lib/utils/date.ts`（JST 日付ユーティリティ）
  - [x] `lib/utils/payment-date.ts`（引き落とし日・確定日算出）
  - [x] `lib/utils/salary-cycle.ts`（給料サイクル計算）
  - [x] `lib/utils/status.ts`（自動ステータス判定）
  - [x] `lib/utils/auth-errors.ts`（Supabase Auth エラー日本語化）
- [x] Supabase クライアント設定
  - [x] `lib/supabase/server.ts`
  - [x] `lib/supabase/client.ts`
  - [x] `lib/supabase/middleware.ts`
- [x] `middleware.ts`（認証チェック・リダイレクト）
- [x] ルートレイアウト（`app/layout.tsx`）とグローバル CSS の更新
- [x] `app/not-found.tsx` を作成

## フェーズ2: 認証（F-06）

- [x] Zod バリデーションスキーマ作成
  - [x] `lib/validations/auth.ts`（login, register, forgot-password, reset-password）
- [x] Server Actions 作成
  - [x] `lib/actions/auth-actions.ts`（login, register, logout, forgotPassword, resetPassword）
- [x] 認証不要エリアのレイアウト
  - [x] `app/(auth)/layout.tsx`
- [x] ログインページ
  - [x] `components/auth/login-form.tsx`
  - [x] `app/(auth)/login/page.tsx`
- [x] 新規登録ページ
  - [x] `components/auth/register-form.tsx`
  - [x] `app/(auth)/register/page.tsx`
- [x] パスワード忘れページ
  - [x] `components/auth/forgot-password-form.tsx`
  - [x] `app/(auth)/forgot-password/page.tsx`
- [x] パスワードリセットページ
  - [x] `components/auth/reset-password-form.tsx`
  - [x] `app/(auth)/reset-password/page.tsx`

## フェーズ3: メインレイアウト + カテゴリ管理（F-05）+ クレカ管理（F-01）

- [x] 認証必須エリアのレイアウト
  - [x] `app/(main)/layout.tsx`（ヘッダーナビ + ボトムナビ）
  - [x] `components/layout/header-nav.tsx`
  - [x] `components/layout/bottom-nav.tsx`

### カテゴリ管理（F-05）

- [x] Zod バリデーション: `lib/validations/category.ts`
- [x] Server Actions: `lib/actions/category-actions.ts`（create, update, delete, reorder, createDefaultCategories）
- [x] コンポーネント作成
  - [x] `components/categories/category-form.tsx`（追加・編集フォーム）
  - [x] `components/categories/category-list.tsx`（D&D リスト）
- [x] ページ作成
  - [x] `app/(main)/budget/page.tsx`
  - [x] `app/(main)/budget/loading.tsx`
  - [x] `app/(main)/budget/error.tsx`

### クレジットカード管理（F-01）

- [x] Zod バリデーション: `lib/validations/credit-card.ts`
- [x] Server Actions: `lib/actions/credit-card-actions.ts`（create, update, delete, reorder）
- [x] コンポーネント作成
  - [x] `components/credit-cards/credit-card-form.tsx`（追加・編集フォーム）
  - [x] `components/credit-cards/credit-card-list.tsx`（D&D リスト）
- [x] ページ作成
  - [x] `app/(main)/credit-cards/page.tsx`
  - [x] `app/(main)/credit-cards/loading.tsx`
  - [x] `app/(main)/credit-cards/error.tsx`

## フェーズ4: 手取り管理（F-02）

- [x] Zod バリデーション: `lib/validations/salary.ts`
- [x] Server Actions: `lib/actions/salary-actions.ts`（create, update, delete）
- [x] コンポーネント作成
  - [x] `components/salary/salary-form.tsx`（追加・編集フォーム + 金額プリセット）
  - [x] `components/salary/salary-list.tsx`（月降順リスト）
- [x] ページ作成
  - [x] `app/(main)/salary/page.tsx`
  - [x] `app/(main)/salary/loading.tsx`
  - [x] `app/(main)/salary/error.tsx`

## フェーズ5: 支払い管理（F-03）

- [x] Zod バリデーション: `lib/validations/payment.ts`
- [x] Server Actions: `lib/actions/payment-actions.ts`
  - [x] createPayment（単体登録 + 自動ステータス判定）
  - [x] updatePayment
  - [x] deletePayment
  - [x] togglePaymentStatus（循環遷移）
  - [x] bulkUpdatePaymentStatus（カード単位一括変更）
  - [x] createRecurringPayments（繰り返し4件作成）
  - [x] deleteRecurringGroup（一括削除）
  - [x] bulkRegisterPayments（一括登録）
- [x] コンポーネント作成
  - [x] `components/payments/payment-form.tsx`（追加・編集フォーム）
  - [x] `components/payments/payment-list.tsx`（フィルター付きリスト）
  - [x] `components/payments/payment-status-badge.tsx`（ステータスバッジ）
  - [x] `components/payments/bulk-register-dialog.tsx`（一括登録ダイアログ）
  - [x] ~~`components/payments/recurring-payment-dialog.tsx`~~（実装方針変更により不要: payment-form.tsx に繰り返し登録ロジックを統合）
- [x] ページ作成
  - [x] `app/(main)/payments/page.tsx`
  - [x] `app/(main)/payments/loading.tsx`
  - [x] `app/(main)/payments/error.tsx`

## フェーズ6: ダッシュボード（F-04）

- [x] ダッシュボード用データ取得ユーティリティ
  - [x] `lib/utils/dashboard.ts`（サイクル内支払い取得、サマリー集計）
- [x] コンポーネント作成
  - [x] `components/dashboard/month-selector.tsx`（月セレクター）
  - [x] `components/dashboard/summary-cards.tsx`（サマリーカード3枚）
  - [x] `components/dashboard/status-breakdown.tsx`（ステータス別内訳）
  - [x] `components/dashboard/payment-schedule.tsx`（支払い予定テーブル）
  - [x] `components/dashboard/fund-flow.tsx`（資金繰りセクション）
- [x] ページ作成
  - [x] `app/(main)/page.tsx`（ダッシュボード）
  - [x] `app/(main)/loading.tsx`
  - [x] `app/(main)/error.tsx`

## フェーズ7: 品質チェックと修正

- [x] リントエラーがないことを確認
  - [x] `npm run lint`
- [x] 型エラーがないことを確認
  - [x] `npm run typecheck`
- [x] ビルドが成功することを確認
  - [x] `npm run build`

---

## 実装後の振り返り

### 実装完了日
2026-03-04

### 計画と実績の差分

**計画と異なった点**:
- Prisma 7 で Rust クエリエンジン廃止、`@prisma/adapter-pg` によるドライバアダプターが必須に。schema.prisma から `url`/`directUrl` を削除し `prisma.config.ts` に移行
- PrismaClient の遅延初期化に Proxy パターンを採用（ビルド時のモジュール評価で DB 接続が発生する問題を回避）
- `recurring-payment-dialog.tsx` を独立コンポーネントとせず `payment-form.tsx` に繰り返し登録ロジックを統合（UI の一貫性を優先）
- Next.js 16 で `middleware` が deprecated になり `proxy` 推奨に変更されたが、現時点では middleware のままで動作

**新たに必要になったタスク**:
- 全5ページに `export const dynamic = "force-dynamic"` を追加（Next.js ビルド時の静的プリレンダリングが Prisma を呼び出す問題）
- `@prisma/adapter-pg` と `pg` パッケージのインストール
- 検証指摘に基づく修正: Zod インポートパス統一、aria-label 追加、role="alert" 追加、shadcn/ui Table 統一、ステータスバリデーション追加

**技術的理由でスキップしたタスク**（該当する場合のみ）:
- [x] ~~`components/payments/recurring-payment-dialog.tsx`~~（実装方針変更により不要: payment-form.tsx に繰り返し登録ロジックを統合）

### 学んだこと

**技術的な学び**:
- Prisma 7 は完全にクライアントサイドエンジンに移行。PostgreSQL 接続には `@prisma/adapter-pg` が必須。`PrismaPg` コンストラクタは `{ connectionString: ... }` オブジェクトを受け取る
- Next.js App Router の `force-dynamic` を設定しても、ビルド時にモジュールのトップレベルコードは評価される。DB クライアントの遅延初期化（Proxy パターン）が必要
- Zod v4 は `zod/v4` サブパスエクスポートを使う。`zod` からの直接インポートとは別のエントリポイント
- 複数の developer サブエージェントを並列起動することで、フェーズ1-6 の実装を効率的に完了できた
- React Compiler と react-hook-form の `watch()` API は互換性問題がある（既知の issue、warning は許容）

**プロセス上の改善点**:
- ステアリングファイルのタスクリストに従い、フェーズごとに並列サブエージェントを活用した実装が効果的だった
- implementation-validator と UI デザインレビューを並列実行することで、品質検証の時間を短縮できた
- tasklist.md をリアルタイムに更新することで進捗が常に可視化された

### 次回への改善提案
- Prisma 7 のアダプターパターンは事前にスキャフォールディング時点で設定すべき（ビルドエラー発見が遅かった）
- アクセシビリティ（aria-label, role="alert" 等）はコンポーネント作成時に最初から組み込むべき（後付け修正よりコスト低）
- budget/page.tsx のパスは F-05 カテゴリ管理用だが、URL が「budget」なので将来の F-07 予算管理との混乱に注意
- 検証で指摘された残課題: salary の同月重複チェックと PRD の設計意図の整合性確認、dashboard.ts の資金繰りロジックの改善、category-form.tsx のカラー二重バインド修正

### 申し送り事項（検証エージェント指摘で未対応の項目）
- マイグレーションファイル未作成（DB 接続環境がないため `prisma migrate dev` 実行不可）
- `salary-actions.ts` の同月重複チェックが PRD のデータモデル（同月複数レコード許容）と矛盾 → 設計確認が必要
- `dashboard.ts` の資金繰りロジック（引き落とし日算出）で異なる利用月の支払いが混在する場合の計算改善
- `category-form.tsx` のカラー Input 二重 register の修正（Controller または watch で同期）
- `web-design-guidelines` スキルによるデザインレビューは general-purpose エージェントで代替実施済み
