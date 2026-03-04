# リポジトリ構造定義書 (Repository Structure Document)

| 項目 | 内容 |
|------|------|
| バージョン | v1.4 |
| 作成日 | 2026-03-04 |
| 更新日 | 2026-03-04 |
| ステータス | 承認済み |
| 対応PRD | product-requirements.md v1.8 |

## 改版履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| v1.0 | 2026-03-04 | 初版作成 |
| v1.1 | 2026-03-04 | レビュー指摘反映: middleware.ts追加、auth/コンポーネント追加、(auth)/にpage.tsx明記、auth-actions.ts追加、utils/ファイル整理、型定義方針追記、constants.ts追加、budget/方針追記 |
| v1.2 | 2026-03-04 | (main)/配下サブディレクトリにファイル展開表示、components/auth/をツリーに追加、budget/コメント改善、__tests__/setup.ts追加、機能設計書との正規化注記追加 |
| v1.3 | 2026-03-04 | lib/types.ts を追加（ActionResult<T> 等の共用型定義）、型定義方針にフレームワーク横断的な共用型の例外を追記 |
| v1.4 | 2026-03-04 | MVP 実装完了後の実態反映: `tailwind.config.ts` を削除（Tailwind CSS v4 は CSS ベース設定）、`prisma.config.ts` を追加（Prisma 7 の接続設定）、`lib/prisma.ts` の説明を Proxy パターンに更新、`lib/utils/dashboard.ts` を追加 |

---

## プロジェクト構造

```
kakeibo-app-v2/
├── app/                          # Next.js App Router（ルーティング・ページ）
│   ├── (auth)/                   # 認証不要エリア（Route Group）
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (main)/                   # 認証必須エリア（Route Group）
│   │   ├── layout.tsx            # メインレイアウト（ナビゲーション付き）
│   │   ├── page.tsx              # ダッシュボード (/)
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── credit-cards/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   ├── salary/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   ├── payments/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   └── budget/               # カテゴリ管理（MVP）→ 予算管理統合予定（Post-MVP）
│   │       ├── page.tsx
│   │       ├── loading.tsx
│   │       └── error.tsx
│   ├── layout.tsx                # ルートレイアウト
│   ├── not-found.tsx
│   └── globals.css
├── components/                   # React コンポーネント
│   ├── ui/                       # shadcn/ui コンポーネント
│   ├── layout/                   # レイアウト系コンポーネント
│   ├── auth/                     # 認証フォームコンポーネント
│   ├── credit-cards/             # クレカ管理コンポーネント
│   ├── salary/                   # 手取り管理コンポーネント
│   ├── payments/                 # 支払い管理コンポーネント
│   ├── categories/               # カテゴリ管理コンポーネント
│   └── dashboard/                # ダッシュボードコンポーネント
├── lib/                          # ユーティリティ・ビジネスロジック
│   ├── supabase/                 # Supabase クライアント設定
│   ├── validations/              # Zod スキーマ（共用）
│   ├── actions/                  # Server Actions
│   ├── utils/                    # ユーティリティ関数
│   ├── constants.ts              # アプリ固有定数（DEFAULT_CATEGORIES 等）
│   ├── types.ts                  # 共用型定義（ActionResult<T> 等）
│   └── prisma.ts                 # Prisma Client（Proxy 遅延初期化 + @prisma/adapter-pg）
├── prisma/                       # Prisma スキーマ・マイグレーション
│   ├── schema.prisma
│   └── migrations/
├── __tests__/                    # テストコード
│   ├── setup.ts                  # テストセットアップ
│   ├── unit/                     # 単体テスト
│   ├── integration/              # 統合テスト
│   └── e2e/                      # E2E テスト
├── public/                       # 静的ファイル
├── docs/                         # プロジェクトドキュメント
├── .steering/                    # ステアリングファイル（作業単位）
├── .claude/                      # Claude Code 設定
│   ├── agents/
│   └── settings.json
├── .devcontainer/                # Dev Container 設定
├── middleware.ts                  # 認証チェック・セッション更新（Edge Runtime）
├── next.config.ts                # Next.js 設定
├── prisma.config.ts              # Prisma 7 接続設定（datasource URL 管理）
├── tsconfig.json                 # TypeScript 設定
├── vitest.config.ts              # Vitest 設定
├── playwright.config.ts          # Playwright 設定
├── eslint.config.mjs             # ESLint 設定
├── .prettierrc                   # Prettier 設定
├── .env.local                    # 環境変数（Git 管理外）
├── .env.example                  # 環境変数テンプレート
├── CLAUDE.md                     # Claude Code プロジェクト設定
└── package.json
```

> **注記**: 機能設計書（functional-design.md）のセクション4.1は簡略版です。
> ファイル配置は本ドキュメントを正とします。

---

## ディレクトリ詳細

### app/ (Next.js App Router)

**役割**: ルーティングとページコンポーネント。App Router の規約に従い、ファイルベースルーティングを実現する。

**配置ファイル**:
- `page.tsx`: ページコンポーネント（Server Component）
- `layout.tsx`: 共有レイアウト
- `loading.tsx`: Suspense フォールバック（Skeleton UI）
- `error.tsx`: エラーバウンダリ（`"use client"` 必須）
- `not-found.tsx`: 404 ページ

**命名規則**:
- ディレクトリ名: kebab-case（`credit-cards/`, `forgot-password/`）
- Route Group: `(auth)/`, `(main)/`（URL に影響しない）
- ファイル名: App Router 規約に従う（`page.tsx`, `layout.tsx` 等）

**依存関係**:
- 依存可能: `components/`, `lib/`
- 依存禁止: `__tests__/`, `prisma/`（直接参照ではなく `lib/prisma.ts` 経由）

**例**:
```
app/(main)/payments/
├── page.tsx          # 支払い一覧ページ（Server Component）
├── loading.tsx       # Skeleton UI
└── error.tsx         # エラーバウンダリ
```

### components/ (React コンポーネント)

**役割**: 再利用可能な UI コンポーネント。ページ横断的に使用されるコンポーネントを配置する。

**配置ファイル**:
- `*.tsx`: React コンポーネント
- Client Component には `"use client"` を付与

**命名規則**:
- ディレクトリ名: kebab-case、機能名（`credit-cards/`, `dashboard/`）
- ファイル名: kebab-case（`payment-form.tsx`, `salary-list.tsx`）
- コンポーネント名（export）: PascalCase（`PaymentForm`, `SalaryList`）

**依存関係**:
- 依存可能: `lib/`, 同階層の `components/ui/`
- 依存禁止: `app/`, `__tests__/`, `prisma/`

**サブディレクトリ**:

| ディレクトリ | 役割 | 例 |
|------------|------|-----|
| `ui/` | shadcn/ui コンポーネント（自動生成） | `button.tsx`, `dialog.tsx` |
| `layout/` | ナビゲーション、ヘッダー、フッター | `header-nav.tsx`, `bottom-nav.tsx` |
| `auth/` | 認証フォームコンポーネント | `login-form.tsx`, `register-form.tsx`, `forgot-password-form.tsx` |
| `credit-cards/` | クレカ管理の UI コンポーネント | `credit-card-form.tsx`, `credit-card-list.tsx` |
| `salary/` | 手取り管理の UI コンポーネント | `salary-form.tsx`, `salary-list.tsx` |
| `payments/` | 支払い管理の UI コンポーネント | `payment-form.tsx`, `bulk-register-dialog.tsx` |
| `categories/` | カテゴリ管理の UI コンポーネント | `category-form.tsx`, `category-list.tsx` |
| `dashboard/` | ダッシュボード専用コンポーネント | `summary-cards.tsx`, `payment-schedule.tsx` |

> **注記**: MVP ではカテゴリ管理コンポーネントを `categories/` に配置。予算管理（Post-MVP）は `budget/` を新設する。

### lib/ (ユーティリティ・ビジネスロジック)

**役割**: ビジネスロジック、バリデーション、ユーティリティ関数、Server Actions を配置する。

**配置ファイル**:
- `*.ts`: TypeScript モジュール（`"use server"` を含む Server Actions も）

**命名規則**:
- ディレクトリ名: kebab-case
- ファイル名: kebab-case（`salary-cycle.ts`, `format.ts`）

**型定義の方針**: 型定義は各モジュールファイルに共置する（独立した `types/` ディレクトリは作成しない）。共用型は `lib/validations/` の Zod スキーマから `z.infer<>` で生成する。ただし、`ActionResult<T>` のようなフレームワーク横断的な共用型は `lib/types.ts` に配置する。

**依存関係**:
- 依存可能: `prisma/`（`lib/prisma.ts` 経由）、外部ライブラリ
- 依存禁止: `app/`, `components/`, `__tests__/`

**サブディレクトリ**:

| ディレクトリ | 役割 | 例 |
|------------|------|-----|
| `supabase/` | Supabase クライアント設定 | `server.ts`, `client.ts`, `middleware.ts` |
| `validations/` | Zod スキーマ（クライアント・サーバー共用） | `payment.ts`, `credit-card.ts` |
| `actions/` | Server Actions（`"use server"`） | `payment-actions.ts`, `salary-actions.ts`, `auth-actions.ts` |
| `utils/` | 汎用ユーティリティ関数 | `salary-cycle.ts`, `format.ts`, `date.ts`, `payment-date.ts`, `status.ts` |

**例**:
```
lib/
├── supabase/
│   ├── server.ts             # createServerClient
│   ├── client.ts             # createBrowserClient
│   └── middleware.ts         # middleware 用クライアント
├── validations/
│   ├── payment.ts            # Payment 用 Zod スキーマ
│   ├── credit-card.ts        # CreditCard 用 Zod スキーマ
│   ├── salary.ts             # Salary 用 Zod スキーマ
│   └── category.ts           # Category 用 Zod スキーマ
├── actions/
│   ├── payment-actions.ts    # 支払い CRUD Server Actions
│   ├── credit-card-actions.ts
│   ├── salary-actions.ts
│   ├── category-actions.ts
│   └── auth-actions.ts       # 認証関連 Server Actions
├── utils/
│   ├── salary-cycle.ts       # 給料サイクル計算
│   ├── format.ts             # 金額・日付フォーマット
│   ├── date.ts               # 日付ユーティリティ
│   ├── payment-date.ts       # 引き落とし日・確定日算出
│   ├── status.ts             # 自動ステータス判定
│   ├── dashboard.ts          # ダッシュボード集計ロジック
│   └── auth-errors.ts        # Supabase Auth エラー日本語化
├── constants.ts              # アプリ固有定数（DEFAULT_CATEGORIES 等）
├── types.ts                  # 共用型定義（ActionResult<T> 等）
└── prisma.ts                 # Prisma Client（Proxy 遅延初期化 + @prisma/adapter-pg）
```

### prisma/ (Prisma スキーマ・マイグレーション)

**役割**: データベーススキーマ定義とマイグレーションファイルの管理。

**配置ファイル**:
- `schema.prisma`: Prisma スキーマ定義
- `migrations/`: マイグレーションファイル（`npx prisma migrate dev` で自動生成）

**命名規則**:
- マイグレーション: `YYYYMMDDHHMMSS_[説明]/migration.sql`（自動生成）

### __tests__/ (テストコード)

**役割**: 全テストコードの配置。テスト種別ごとにサブディレクトリを分ける。

**命名規則**:
- テストファイル: `[テスト対象].test.ts` / `[テスト対象].test.tsx`
- E2E テスト: `[シナリオ].spec.ts`

**構造**:
```
__tests__/
├── setup.ts
├── unit/
│   ├── lib/
│   │   ├── utils/
│   │   │   ├── salary-cycle.test.ts
│   │   │   ├── format.test.ts
│   │   │   └── status.test.ts
│   │   └── validations/
│   │       ├── payment.test.ts
│   │       └── credit-card.test.ts
│   └── components/
│       ├── payment-form.test.tsx
│       └── summary-cards.test.tsx
├── integration/
│   └── actions/
│       ├── payment-actions.test.ts
│       └── salary-actions.test.ts
└── e2e/
    ├── auth.spec.ts
    ├── payment-flow.spec.ts
    └── dashboard.spec.ts
```

### docs/ (プロジェクトドキュメント)

**配置ドキュメント**:
- `product-requirements.md`: プロダクト要求定義書
- `functional-design.md`: 機能設計書
- `architecture.md`: アーキテクチャ設計書
- `repository-structure.md`: リポジトリ構造定義書（本ドキュメント）
- `development-guidelines.md`: 開発ガイドライン
- `glossary.md`: 用語集

---

## ファイル配置規則

### ソースファイル

| ファイル種別 | 配置先 | 命名規則 | 例 |
|------------|--------|---------|-----|
| ページ | `app/[route]/` | `page.tsx` (固定) | `app/(main)/payments/page.tsx` |
| レイアウト | `app/[route]/` | `layout.tsx` (固定) | `app/(main)/layout.tsx` |
| Server Action | `lib/actions/` | `[機能]-actions.ts` | `payment-actions.ts` |
| Zod スキーマ | `lib/validations/` | `[エンティティ].ts` | `payment.ts` |
| ユーティリティ | `lib/utils/` | `[機能].ts` | `salary-cycle.ts` |
| UI コンポーネント | `components/ui/` | `[コンポーネント].tsx` | `button.tsx` |
| 機能コンポーネント | `components/[機能]/` | `[コンポーネント].tsx` | `payment-form.tsx` |
| ミドルウェア | ルート | `middleware.ts` (固定) | `middleware.ts` |
| Prisma スキーマ | `prisma/` | `schema.prisma` (固定) | `prisma/schema.prisma` |

### テストファイル

| テスト種別 | 配置先 | 命名規則 | 例 |
|-----------|--------|---------|-----|
| 単体テスト | `__tests__/unit/` | `[対象].test.ts(x)` | `salary-cycle.test.ts` |
| 統合テスト | `__tests__/integration/` | `[機能]-actions.test.ts` | `payment-actions.test.ts` |
| E2E テスト | `__tests__/e2e/` | `[シナリオ].spec.ts` | `auth.spec.ts` |

### 設定ファイル

| ファイル | 配置先 | 説明 |
|---------|--------|------|
| `next.config.ts` | ルート | Next.js 設定 |
| `tsconfig.json` | ルート | TypeScript 設定（strict mode） |
| `vitest.config.ts` | ルート | Vitest テスト設定 |
| `playwright.config.ts` | ルート | Playwright E2E 設定 |
| `eslint.config.mjs` | ルート | ESLint Flat Config |
| `prisma.config.ts` | ルート | Prisma 7 接続設定（datasource URL 管理） |
| `.prettierrc` | ルート | Prettier フォーマット設定 |
| `.env.local` | ルート | 環境変数（Git 管理外） |
| `.env.example` | ルート | 環境変数テンプレート |

---

## 命名規則

### ディレクトリ名

- **全ディレクトリ**: kebab-case
  - 例: `credit-cards/`, `forgot-password/`, `salary-cycle/`
- **Route Group**: `(group-name)/`
  - 例: `(auth)/`, `(main)/`

### ファイル名

- **App Router ファイル**: 規約通り（`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`）
- **コンポーネント**: kebab-case + `.tsx`
  - 例: `payment-form.tsx`, `summary-cards.tsx`
- **ユーティリティ**: kebab-case + `.ts`
  - 例: `salary-cycle.ts`, `format.ts`
- **Server Actions**: `[機能]-actions.ts`
  - 例: `payment-actions.ts`, `category-actions.ts`
- **Zod スキーマ**: `[エンティティ].ts`
  - 例: `payment.ts`, `credit-card.ts`

### エクスポート名

- **コンポーネント**: PascalCase
  - 例: `export function PaymentForm() {}`
- **関数**: camelCase
  - 例: `export function calculateSalaryCycle() {}`
- **型/インターフェース**: PascalCase
  - 例: `export type PaymentStatus = "unconfirmed" | "confirmed" | "paid"`
- **定数**: UPPER_SNAKE_CASE
  - 例: `export const DEFAULT_CATEGORIES = [...]`

---

## 依存関係のルール

### レイヤー間の依存

```
app/ (ページ)
  ↓ (OK)
components/ (UI コンポーネント)
  ↓ (OK)
lib/ (ビジネスロジック・ユーティリティ)
  ↓ (OK)
prisma/ (データアクセス ※ lib/prisma.ts 経由)
```

**禁止される依存**:
- `lib/` → `components/` (❌)
- `lib/` → `app/` (❌)
- `components/` → `app/` (❌)
- `app/` → `prisma/` 直接参照 (❌) ※ `lib/prisma.ts` 経由は OK

### モジュール間の依存

- `lib/actions/` は `lib/validations/` と `lib/prisma.ts` に依存する
- `lib/utils/` は外部ライブラリ（date-fns 等）のみに依存し、他の `lib/` サブディレクトリに依存しない
- `components/[機能]/` は `lib/validations/` と `lib/actions/` に依存可能

---

## スケーリング戦略

### 機能の追加

新しい機能を追加する場合の配置方針:

1. **ページ追加**: `app/(main)/[new-feature]/page.tsx` を作成
2. **コンポーネント追加**: `components/[new-feature]/` ディレクトリを作成
3. **Server Action 追加**: `lib/actions/[new-feature]-actions.ts` を作成
4. **バリデーション追加**: `lib/validations/[new-feature].ts` を作成
5. **データモデル追加**: `prisma/schema.prisma` にモデル追加 + マイグレーション

**Post-MVP 機能の追加例（F-08 レポート）**:
```
app/(main)/reports/page.tsx          # 新規ページ
components/reports/                   # 新規コンポーネントディレクトリ
  ├── monthly-chart.tsx
  └── category-pie-chart.tsx
lib/actions/report-actions.ts        # 新規 Server Action
```

### ファイルサイズの管理

- 1 ファイル: 300 行以下を推奨
- 300-500 行: リファクタリングを検討
- 500 行以上: 分割を強く推奨

---

## 特殊ディレクトリ

### .steering/ (ステアリングファイル)

**役割**: 特定の開発作業における「今回何をするか」を定義

**構造**:
```
.steering/
└── [YYYYMMDD]-[task-name]/
    ├── requirements.md
    ├── design.md
    └── tasklist.md
```

### .claude/ (Claude Code 設定)

**役割**: プロジェクト固有の Claude Code カスタマイズ

**構造**:
```
.claude/
├── agents/
│   └── implementation-validator.md
└── settings.json
```

---

## 除外設定

### .gitignore

```
node_modules/
.next/
.env.local
.env*.local
.vercel
*.log
.DS_Store
coverage/
.steering/
```

### .prettierignore / .eslintignore

```
.next/
node_modules/
coverage/
prisma/migrations/
```
