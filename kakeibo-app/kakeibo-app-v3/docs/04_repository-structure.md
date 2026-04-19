# リポジトリ構造定義書 (Repository Structure Document)

| 項目 | 内容 |
|------|------|
| プロダクト | kakeibo-app v3 |
| バージョン | v1.0 |
| 作成日 | 2026-04-17 |

## プロジェクト構造

```
kakeibo-app-v3/
├── app/                                  # Next.js App Router ルート
│   ├── (auth)/                           # 認証画面グループ（未認証でもアクセス可）
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (main)/                           # 認証必須画面グループ
│   │   ├── layout.tsx                    # サイドナビ・ヘッダー
│   │   ├── page.tsx                      # ダッシュボード "/"
│   │   ├── accounts/
│   │   │   └── page.tsx
│   │   ├── salary/
│   │   │   └── page.tsx
│   │   ├── credit-cards/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── reconcile/page.tsx
│   │   ├── budget/
│   │   │   └── page.tsx
│   │   ├── payments/
│   │   │   ├── page.tsx
│   │   │   └── import/page.tsx
│   │   ├── calendar/
│   │   │   └── page.tsx
│   │   └── reports/
│   │       └── page.tsx
│   ├── layout.tsx                        # ルートレイアウト（<html>, <body>）
│   ├── loading.tsx                       # 全体フォールバック
│   ├── error.tsx                         # グローバルエラー
│   ├── not-found.tsx
│   └── globals.css                       # Tailwind エントリー
├── components/                           # UI コンポーネント
│   ├── ui/                               # shadcn/ui 配置先
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   └── ...
│   ├── layout/                           # ヘッダー・ナビ等
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── bottom-nav.tsx
│   ├── auth/                             # 認証フォーム
│   ├── accounts/                         # 口座 CRUD UI
│   ├── salary/                           # 手取り管理 UI
│   ├── credit-cards/                     # カード管理 UI
│   ├── budget/                           # カテゴリ・予算 UI
│   ├── categories/                       # （budget から分離）カテゴリ管理 UI
│   ├── payments/
│   │   ├── payment-form.tsx
│   │   ├── payment-list.tsx
│   │   ├── payment-status-badge.tsx
│   │   └── import/                       # CSV インポート UI
│   │       ├── csv-uploader.tsx
│   │       ├── column-mapper.tsx
│   │       └── import-preview.tsx
│   ├── reconcile/                        # 誤差ゼロ照合 UI
│   │   ├── statement-form.tsx
│   │   └── statement-diff.tsx
│   ├── dashboard/
│   │   ├── available-money-card.tsx      # v3 の主役カード
│   │   ├── breakdown-cards.tsx
│   │   ├── payment-schedule.tsx
│   │   ├── status-breakdown.tsx
│   │   ├── budget-consumption.tsx
│   │   └── empty-state-banner.tsx
│   ├── calendar/
│   │   ├── month-calendar.tsx
│   │   ├── day-cell.tsx
│   │   └── quick-payment-dialog.tsx
│   └── reports/
│       ├── category-pie-chart.tsx
│       └── monthly-trend-chart.tsx
├── lib/                                  # ビジネスロジック・ユーティリティ
│   ├── actions/                          # Server Actions ("use server")
│   │   ├── auth-actions.ts
│   │   ├── account-actions.ts
│   │   ├── salary-actions.ts
│   │   ├── credit-card-actions.ts
│   │   ├── category-actions.ts
│   │   ├── budget-actions.ts
│   │   ├── payment-actions.ts
│   │   ├── statement-actions.ts
│   │   └── csv-import-actions.ts
│   ├── utils/                            # 純粋関数ユーティリティ
│   │   ├── date.ts
│   │   ├── format.ts
│   │   ├── salary-cycle.ts
│   │   ├── payment-date.ts
│   │   ├── status.ts
│   │   ├── available-money.ts            # ★ v3 中核
│   │   ├── reconcile.ts
│   │   ├── csv-import.ts
│   │   ├── dashboard.ts                  # 集計系
│   │   └── report.ts                     # レポート用集計
│   ├── validations/                      # Zod スキーマ
│   │   ├── auth.ts
│   │   ├── account.ts
│   │   ├── salary.ts
│   │   ├── credit-card.ts
│   │   ├── category.ts
│   │   ├── budget.ts
│   │   ├── payment.ts
│   │   ├── statement.ts
│   │   └── csv-import.ts
│   ├── supabase/
│   │   ├── server.ts                     # createServerClient
│   │   ├── client.ts                     # createBrowserClient
│   │   └── middleware.ts                 # updateSession
│   ├── prisma.ts                         # Prisma シングルトン
│   ├── types.ts                          # 共通型定義
│   └── constants.ts                      # 定数（デフォルトカテゴリ等）
├── prisma/
│   ├── schema.prisma
│   ├── rls_policies.sql                  # RLS ポリシー定義
│   ├── seed.ts                           # 初期データ投入
│   └── migrations/
│       └── [timestamp]_[name]/
│           └── migration.sql
├── public/                               # 静的ファイル
│   └── favicon.ico
├── __tests__/                            # テストコード
│   ├── unit/
│   │   ├── lib/
│   │   │   ├── available-money.test.ts
│   │   │   ├── reconcile.test.ts
│   │   │   ├── csv-import.test.ts
│   │   │   ├── salary-cycle.test.ts
│   │   │   ├── payment-date.test.ts
│   │   │   └── status.test.ts
│   │   └── components/                   # 主要コンポーネント
│   │       ├── payment-form.test.tsx
│   │       └── ...
│   ├── integration/                      # Server Actions 統合
│   │   ├── account-actions.test.ts
│   │   ├── payment-actions.test.ts
│   │   └── statement-actions.test.ts
│   └── e2e/
│       ├── golden-path.spec.ts
│       └── screenshots/                  # Playwright スクショ
├── docs/                                 # プロジェクトドキュメント
│   ├── 01_product-requirements.md
│   ├── 02_functional-design.md
│   ├── 03_architecture.md
│   ├── 04_repository-structure.md        # 本ドキュメント
│   ├── 05_development-guidelines.md
│   ├── 06_test-plan.md
│   ├── 07_glossary.md
│   ├── 08_test-result-report.md
│   └── mockups/                          # Mermaid or 画像
├── .steering/                            # 作業単位の一時ファイル（gitignore）
├── .claude/                              # プロジェクト固有 Claude Code 設定
│   └── settings.local.json
├── .env.example                          # 環境変数テンプレート
├── .env.local                            # 開発用（gitignore）
├── .gitignore
├── .prettierrc
├── .prettierignore
├── eslint.config.mjs
├── next.config.ts
├── next-env.d.ts
├── middleware.ts                         # Next.js middleware（認証チェック）
├── package.json
├── package-lock.json
├── playwright.config.ts
├── postcss.config.mjs
├── prisma.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── CLAUDE.md                             # プロジェクト固有ルール
└── README.md
```

## ディレクトリ詳細

### app/ (Next.js App Router)

**役割**: ルーティング・ページ定義・レイアウト

**配置ファイル**:
- `page.tsx`: ページコンポーネント（Server Component デフォルト）
- `layout.tsx`: レイアウトコンポーネント
- `loading.tsx`: Suspense フォールバック（Skeleton UI）
- `error.tsx`: エラーバウンダリ（`"use client"` 必須）
- `not-found.tsx`: 404 ページ
- Route Group `(name)/`: ルーティングパスに影響しないグループ化

**命名規則**:
- ディレクトリ名: kebab-case、URL パスと一致
- Dynamic Route: `[param]/`
- Route Group: `(name)/`

**依存関係**:
- 依存可能: `components/`, `lib/actions/`, `lib/utils/`, `lib/supabase/`, `lib/prisma.ts`
- 依存禁止: 他の `app/` 配下の Page/Layout（インポートせず、props やナビゲーションで連携）

### components/ (UI コンポーネント)

**役割**: 再利用可能な UI 部品

**サブディレクトリ方針**:
- `ui/`: shadcn/ui のコピー（カスタマイズ可）
- 機能別ディレクトリ (`accounts/`, `payments/` 等): ドメインに密結合したコンポーネント
- `layout/`: サイト全体のヘッダー・ナビ等

**命名規則**:
- ファイル名: kebab-case（例: `payment-form.tsx`）
- コンポーネント名: PascalCase（例: `PaymentForm`）
- Client Component は `"use client"` を先頭に明記

**依存関係**:
- 依存可能: `components/ui/`, `lib/utils/`, `lib/validations/`, `lib/actions/`（Client Components から呼ぶ場合）
- 依存禁止: `lib/prisma.ts` を直接インポートしない（Server Actions 経由）

### lib/ (ビジネスロジック)

#### lib/actions/

**役割**: Server Actions（データ更新処理）

**ファイルパターン**: `[resource]-actions.ts`

**命名規則**:
- 関数名: 動詞で始める（例: `createPayment`, `updateStatement`, `deleteAccount`）
- ファイル先頭に `"use server"` ディレクティブ必須

**必須処理**:
1. Supabase Auth で user 取得（未認証なら throw）
2. Zod で入力検証
3. ドメインロジック（`lib/utils/`）呼び出し
4. Prisma で DB 更新
5. `revalidatePath()` で該当画面の再生成

#### lib/utils/

**役割**: 副作用のない純粋関数

**ファイルパターン**: kebab-case、機能単位

**命名規則**:
- 関数名: camelCase、動詞で始める
- 引数で `asOf: Date` を受け取る（`Date.now()` 直接呼び出し禁止）

**依存関係**:
- 依存禁止: Prisma, Supabase, `app/`, `components/`
- Node.js 組み込み以外は date-fns のみ許可

#### lib/validations/

**役割**: Zod スキーマ定義

**ファイルパターン**: `[resource].ts`

**命名規則**:
- スキーマ名: `[Resource]Schema`（例: `PaymentSchema`）
- 型: `z.infer<typeof PaymentSchema>` で `PaymentInput` 等をエクスポート

#### lib/supabase/

**役割**: Supabase クライアントのファクトリー

**ファイル**:
- `server.ts`: Server Components/Actions 用（Cookie 読取）
- `client.ts`: Client Components 用（ブラウザ）
- `middleware.ts`: middleware.ts から呼ばれるセッション更新

### prisma/

**役割**: DB スキーマ・マイグレーション・シード

**ファイル**:
- `schema.prisma`: モデル定義
- `rls_policies.sql`: RLS ポリシー（マイグレーション後に手動適用）
- `seed.ts`: 初期データ（デフォルトカテゴリ等）
- `migrations/`: 自動生成（手動編集禁止）

### __tests__/ (テストディレクトリ)

#### unit/

**役割**: 純粋関数・コンポーネント単体テスト

**構造**:
```
__tests__/unit/
├── lib/              # lib/utils と同じ構造
│   └── [name].test.ts
└── components/       # components と同じ構造
    └── [name].test.tsx
```

**命名規則**: `[対象].test.ts(x)`

#### integration/

**役割**: Server Actions の統合テスト（DB 操作含む）

**構造**:
```
__tests__/integration/
└── [resource]-actions.test.ts
```

#### e2e/

**役割**: Playwright による E2E シナリオ

**構造**:
```
__tests__/e2e/
├── golden-path.spec.ts    # 登録〜照合〜ダッシュボード
└── screenshots/           # PNG 出力
```

**実行コマンド**: `npx playwright test --headed --reporter=list`

### docs/ (ドキュメント)

**配置ドキュメント**（8 文書体系）:
- `01_product-requirements.md` — PRD
- `02_functional-design.md` — 機能設計書
- `03_architecture.md` — アーキテクチャ
- `04_repository-structure.md` — リポジトリ構造（本ドキュメント）
- `05_development-guidelines.md` — 開発ガイドライン
- `06_test-plan.md` — テスト計画
- `07_glossary.md` — 用語集
- `08_test-result-report.md` — テスト結果報告書（Phase 8 で記入）

**サブディレクトリ**:
- `mockups/`: 画面モックアップ（Markdown + Mermaid or 画像）

### .steering/ (作業単位の一時ファイル)

**役割**: 「今回何をするか」を記録する作業用ディレクトリ

**構造**:
```
.steering/
└── [YYYYMMDD]-[task-name]/
    ├── requirements.md
    ├── design.md
    └── tasklist.md
```

**Git 管理**: `.gitignore` に追加

## ファイル配置規則

### ソースファイル

| ファイル種別 | 配置先 | 命名規則 | 例 |
|------------|--------|---------|-----|
| Page | `app/(group)/path/page.tsx` | `page.tsx` 固定 | `app/(main)/accounts/page.tsx` |
| Layout | `app/(group)/path/layout.tsx` | `layout.tsx` 固定 | `app/(main)/layout.tsx` |
| UI コンポーネント | `components/[feature]/` | kebab-case | `components/payments/payment-form.tsx` |
| shadcn/ui | `components/ui/` | kebab-case | `components/ui/button.tsx` |
| Server Action | `lib/actions/` | `[resource]-actions.ts` | `lib/actions/payment-actions.ts` |
| 純粋関数 | `lib/utils/` | kebab-case | `lib/utils/available-money.ts` |
| Zod スキーマ | `lib/validations/` | `[resource].ts` | `lib/validations/payment.ts` |

### テストファイル

| テスト種別 | 配置先 | 命名規則 | 例 |
|-----------|--------|---------|-----|
| ユニット（ロジック） | `__tests__/unit/lib/` | `[対象].test.ts` | `available-money.test.ts` |
| ユニット（コンポーネント） | `__tests__/unit/components/[feature]/` | `[対象].test.tsx` | `payment-form.test.tsx` |
| 統合 | `__tests__/integration/` | `[resource]-actions.test.ts` | `payment-actions.test.ts` |
| E2E | `__tests__/e2e/` | `[シナリオ].spec.ts` | `golden-path.spec.ts` |

### 設定ファイル

| ファイル種別 | 配置先 | ファイル名 |
|------------|--------|-----------|
| Next.js | ルート | `next.config.ts` |
| TypeScript | ルート | `tsconfig.json` |
| Tailwind | ルート | `tailwind.config.ts` |
| ESLint | ルート | `eslint.config.mjs` |
| Prettier | ルート | `.prettierrc` |
| Vitest | ルート | `vitest.config.ts` |
| Playwright | ルート | `playwright.config.ts` |
| Prisma | ルート | `prisma.config.ts` |

## 命名規則

### ディレクトリ名

- 機能ディレクトリ: kebab-case（例: `credit-cards/`, `forgot-password/`）
- Route Group: `(name)/`（パスに影響しない）
- Dynamic Route: `[param]/`

### ファイル名

- React コンポーネント: kebab-case（例: `payment-form.tsx`）
- ユーティリティ関数: kebab-case（例: `salary-cycle.ts`）
- 設定ファイル: 慣例に従う（例: `next.config.ts`）

### 識別子

- コンポーネント: PascalCase（例: `PaymentForm`）
- 関数: camelCase（例: `calculateSalaryCycle`）
- 型・インターフェース: PascalCase（例: `PaymentInput`）
- 定数: UPPER_SNAKE_CASE（例: `DEFAULT_CATEGORIES`）
- Zod スキーマ: PascalCase + Schema（例: `PaymentSchema`）

## 依存関係のルール

### レイヤー間の依存

```
app/ (UI/Page)
    ↓
components/       → lib/actions/ (Client から呼び出し)
    ↓                  ↓
lib/utils/        ← lib/validations/
    ↓                  ↓
lib/prisma.ts / lib/supabase/
```

**禁止される依存**:
- `lib/utils/` → Prisma / Supabase / `app/` / `components/` （純粋関数を保つ）
- `components/` → `lib/prisma.ts`（Server Actions 経由）
- `app/api/` ルートは MVP では作らない（Server Actions で完結）

### 循環依存

禁止。共通型は `lib/types.ts` に抽出。

## スケーリング戦略

### 機能の追加

新規リソース追加の手順:
1. `prisma/schema.prisma` にモデル追加 → `prisma migrate dev`
2. `prisma/rls_policies.sql` にポリシー追加
3. `lib/validations/[resource].ts` に Zod スキーマ
4. `lib/actions/[resource]-actions.ts` に Server Actions
5. `components/[resource]/` に UI コンポーネント
6. `app/(main)/[path]/page.tsx` にページ
7. `__tests__/unit/` と `__tests__/integration/` にテスト

### ファイルサイズの管理

- 1 ファイル 300 行以下を推奨
- 500 行超はレビューで分割を求める
- Server Actions ファイルは 1 リソース 1 ファイルを目安、肥大化したら機能単位に分割

## 特殊ディレクトリ

### .claude/

**役割**: プロジェクト固有 Claude Code 設定

**構造**:
```
.claude/
├── settings.local.json   # 許可 Bash コマンド等
└── (汎用設定は ~/.claude/ に配置)
```

### mockups/ (docs 配下)

**役割**: 画面モックアップ

**形式**: Markdown + Mermaid、または PNG 画像

## 除外設定

### .gitignore

```
node_modules/
.next/
.vercel/
out/
.env
.env.local
.env.*.local
.steering/
__tests__/e2e/screenshots/*.png
test-results/
playwright-report/
*.log
.DS_Store
coverage/
```

### .prettierignore / .eslintignore

```
node_modules/
.next/
dist/
coverage/
__tests__/e2e/screenshots/
```
