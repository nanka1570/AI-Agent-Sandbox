# 開発ガイドライン (Development Guidelines)

| 項目 | 内容 |
|------|------|
| バージョン | v1.3 |
| 作成日 | 2026-03-04 |
| 更新日 | 2026-03-04 |
| ステータス | 承認待ち |
| 対応PRD | product-requirements.md v1.8 |

## 改版履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| v1.0 | 2026-03-04 | 初版作成 |
| v1.1 | 2026-03-04 | レビュー指摘対応: Supabase Auth モック実装パターン追加（6.3）、ESLint/Prettier 設定方針追記（1.2）、React Hook Form + Zod 統合パターン追加（4.2）、D&D sortOrder パターン追加（3.6）、.env.local 環境変数詳細追記（7.2）、Server Action エラーハンドリング方針・Prisma トランザクション方針・revalidatePath 対応表追記（2.2）、vitest.config.ts 推奨設定追記（6） |
| v1.2 | 2026-03-04 | レビュー指摘対応: Server Action エラーハンドリングを safeParse + ActionResult<T> 型に統一（1.4, 2.2, 4.2）、revalidatePath 対応表にカード削除時の /payments 追加（2.2）、SUPABASE_SERVICE_ROLE_KEY を環境変数テーブルに追加（7.2）、ESLint Flat Config 設定例追加（1.2）、playwright.config.ts 推奨設定追加（6） |
| v1.3 | 2026-03-04 | Playwright testDir を `__tests__/e2e/` に修正（6）、セクション2.2の残存 `.parse()` コード例を削除しセクション1.4への参照に置換 |

---

## 1. コーディング規約

### 1.1 命名規則

#### 変数・関数

```typescript
// 変数: camelCase、名詞または名詞句
const paymentAmount = 12000;
const creditCardList = await fetchCreditCards();

// 関数: camelCase、動詞で始める
function calculateSalaryCycle(payDay: number, month: string) {}
function formatCurrency(amount: number): string {}

// 定数: UPPER_SNAKE_CASE
const MAX_CARDS_PER_USER = 10;
const DEFAULT_PAY_DAY = 25;

// Boolean: is, has, should, can で始める
const isRecurring = true;
const hasConfirmationDay = card.confirmationDay !== null;
const canDelete = !category.isDefault;
```

#### 型・インターフェース

```typescript
// 型エイリアス: PascalCase（ユニオン型、リテラル型）
type PaymentStatus = "unconfirmed" | "confirmed" | "paid";
type CardBrand = "visa" | "mastercard" | "jcb" | "amex" | "other";

// インターフェース: PascalCase（オブジェクト型）
interface CreatePaymentInput {
  creditCardId: string;
  month: string;
  amount: number;
  categoryId?: string;
}
```

#### ファイル名

```
// コンポーネント: kebab-case.tsx
payment-form.tsx
summary-cards.tsx
bulk-register-dialog.tsx

// ユーティリティ: kebab-case.ts
salary-cycle.ts
format-currency.ts
auth-errors.ts

// Server Actions: [機能]-actions.ts
payment-actions.ts
credit-card-actions.ts
```

### 1.2 コードフォーマット

- **インデント**: 2 スペース
- **行の長さ**: 最大 100 文字
- **セミコロン**: あり（Prettier デフォルト）
- **引用符**: ダブルクォート（Prettier デフォルト）
- **末尾カンマ**: あり（`"trailingComma": "all"`）

Prettier と ESLint で自動整形。手動フォーマットは不要。

#### ESLint 設定

- 設定ファイル: `eslint.config.mjs`（Flat Config 形式、ESLint 9.x 対応）
- ルールセット: `@next/eslint-plugin-next`（Next.js 推奨ルール）+ `typescript-eslint`（型安全ルール）

```javascript
// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
```

#### Prettier 設定

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100
}
```

#### VS Code 推奨設定

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

#### CI チェックコマンド

```bash
npm run lint        # ESLint による静的解析
npm run typecheck   # tsc --noEmit による型チェック
```

### 1.3 コメント規約

```typescript
// ✅ なぜそうするかを説明
// payDay=1 の場合、翌月0日は存在しないため当月末日に丸める
if (payDay === 1) {
  return endOfMonth(cycleStart);
}

// ✅ 複雑なビジネスロジックの意図を説明
// 引き落とし日 ≤ 今日 → paid（優先順: paid > confirmed > unconfirmed）
if (isPaymentDatePassed) {
  return "paid";
}

// ❌ コードの内容を繰り返すだけ（不要）
// amount に 1000 を代入
const amount = 1000;
```

- 自明なコードにコメントは不要
- ビジネスルールの「なぜ」を説明するコメントのみ記述
- TODO/FIXME は Issue 番号と併記: `// TODO: キャッシュ実装 (#123)`

### 1.4 エラーハンドリング

#### Server Actions でのエラー処理（safeParse + ActionResult<T> 型）

```typescript
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";

const paymentSchema = z.object({
  creditCardId: z.string().cuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  amount: z.number().int().min(1),
  categoryId: z.string().cuid().nullable(),
});

export async function createPayment(data: unknown): Promise<ActionResult> {
  // 1. バリデーション（safeParse で例外をスローしない）
  const parsed = paymentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "入力内容に誤りがあります", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // 2. DB 操作（try-catch で例外を ActionResult に変換）
  try {
    await prisma.payment.create({ data: parsed.data });
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { success: false, error: "支払いの登録に失敗しました" };
  }
}
```

#### Client Components でのエラー表示

```typescript
// ActionResult の success フラグで分岐
const result = await createPayment(formData);
if (result.success) {
  toast.success("支払いを登録しました");
} else {
  toast.error(result.error);
  // fieldErrors がある場合はフォームにインラインエラーを反映
}
```

---

## 2. Next.js App Router 固有ルール

### 2.1 Server Components / Client Components

```typescript
// ✅ Server Component（デフォルト）- データ取得を直接行う
async function PaymentsPage() {
  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { month: "desc" },
  });
  return <PaymentList payments={payments} />;
}

// ✅ Client Component - インタラクションが必要な最小単位に分離
"use client";
function PaymentForm({ creditCards }: { creditCards: CreditCard[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // フォーム処理
}

// ❌ ページ全体を Client Component にしない
// "use client"  ← 不要
// export default function PaymentsPage() { ... }
```

### 2.2 Server Actions

```typescript
// ✅ lib/actions/ に配置し、"use server" を付与
// ✅ safeParse + ActionResult<T> パターンで実装（詳細はセクション1.4を参照）

// ❌ API Route 経由の CRUD は使わない
// app/api/payments/route.ts ← 不要
```

#### エラーハンドリング方針

Server Actions は `safeParse` + `ActionResult<T>` 型を採用する。Zod バリデーションエラーは `safeParse` で検証し、DB エラーは `try-catch` でキャッチして、いずれも `ActionResult` 型として返却する。Client Component 側では `result.success` フラグで分岐する。

```typescript
// ActionResult 型定義（lib/types.ts）
type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// Server Action 側: ActionResult を返す（例外をスローしない）
"use server";
import type { ActionResult } from "@/lib/types";

export async function createPayment(data: unknown): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "入力内容に誤りがあります", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await prisma.payment.create({ data: parsed.data });
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { success: false, error: "支払いの登録に失敗しました" };
  }
}

// Client Component 側: result.success フラグで分岐
const result = await createPayment(formData);
if (result.success) {
  toast.success("保存しました");
} else {
  toast.error(result.error);
  // fieldErrors がある場合はフォームに反映
}
```

#### Prisma トランザクション使用方針

複数レコードの原子的操作には `prisma.$transaction` を使用する。1 つでも失敗した場合は全操作をロールバックする。

```typescript
// 例: 繰り返し支払い登録（本体1件 + 翌月以降3件 = 計4レコード同時作成）
await prisma.$transaction(
  monthList.map((month) =>
    prisma.payment.create({
      data: { ...baseData, month, recurringGroupId },
    }),
  ),
);
```

適用場面:
- 繰り返し支払い登録（4レコード同時作成）
- 繰り返しグループ一括削除
- sortOrder の正規化保存（D&D）

#### revalidatePath 対応表

Server Action でデータ更新後に再検証するパスの一覧:

| 操作 | revalidatePath 対象 |
|------|-------------------|
| 支払いの追加・編集・削除 | `/payments`, `/` |
| 手取りの追加・編集・削除 | `/salary`, `/` |
| カードの追加・編集・削除 | `/credit-cards`, `/payments`（削除時）, `/` |
| カテゴリの追加・編集・削除 | `/budget` |

- `/`（ダッシュボード）は支払い・手取り・カード操作時に再検証する（サマリーカードの集計値に影響するため）
- カテゴリの変更はダッシュボードの集計値に直接影響しないため、`/budget` のみ再検証する

### 2.3 loading.tsx / error.tsx

```typescript
// loading.tsx - Skeleton UI を表示
export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

// error.tsx - "use client" 必須
"use client";
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="text-center py-8">
      <p className="text-destructive">エラーが発生しました</p>
      <Button onClick={reset}>再試行</Button>
    </div>
  );
}
```

---

## 3. UI 実装ルール

### 3.1 モバイルファースト

```tsx
// ✅ モバイルファースト（小さい画面がデフォルト）
<div className="flex flex-col gap-4 md:flex-row md:gap-6">
  <Card className="w-full md:w-1/3" />
  <Card className="w-full md:w-2/3" />
</div>

// ❌ デスクトップファースト
<div className="flex flex-row gap-6 max-md:flex-col max-md:gap-4">
```

### 3.2 shadcn/ui の使用

- 基本 UI コンポーネント（Button, Input, Dialog, Card 等）は shadcn/ui を使用
- `components/ui/` に配置（`npx shadcn@latest add [component]` で追加）
- 独自 CSS での自作は shadcn/ui で実現できない場合のみ

### 3.3 金額表示

```typescript
// ✅ 統一フォーマッター
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(amount);
}
// → "¥12,345"

// ❌ 手動フォーマット
`${amount.toLocaleString()}円`
```

### 3.4 トースト通知

```typescript
// 操作の成功/失敗は即座にトーストで通知
toast.success("支払いを登録しました");        // 成功: 2-3秒で自動消去
toast.error("登録に失敗しました");            // エラー: 手動で閉じるまで表示
```

### 3.5 確認ダイアログ

削除等の破壊的操作には必ず確認ダイアログを表示:
- 「キャンセル」（左/薄色）＋「削除」（右/赤色）

### 3.6 ドラッグ&ドロップ（sortOrder）

`@dnd-kit/core` を使用して、カード・カテゴリの並び順をドラッグ&ドロップで変更する。

#### sortOrder の管理ルール

PRD（v1.8）で定義された以下のルールを厳守する:

- **削除時**: sortOrder の欠番は詰め直さない（例: 1,2,3 のうち 2 を削除 → 1,3 のまま）
- **D&D 保存時のみ正規化**: ドラッグ&ドロップで並び替えを保存する際に 0,1,2,3... と連番に正規化する

#### Client Component（D&D UI）

```typescript
"use client";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

export function SortableList({ items, onReorder }: Props) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);

    // Server Action で sortOrder を正規化して保存
    onReorder(reordered.map((item) => item.id));
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {/* SortableItem コンポーネント */}
      </SortableContext>
    </DndContext>
  );
}
```

#### Server Action（sortOrder 正規化保存）

```typescript
"use server";

export async function reorderCreditCards(orderedIds: string[]) {
  // D&D 保存時に 0,1,2,... の連番に正規化
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.creditCard.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );
  revalidatePath("/credit-cards");
}
```

---

## 4. バリデーション

### 4.1 Zod スキーマの共用

```typescript
// lib/validations/payment.ts
// クライアント（React Hook Form）とサーバー（Server Actions）で共用
import { z } from "zod";

export const paymentSchema = z.object({
  creditCardId: z.string().cuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "YYYY-MM 形式で入力してください"),
  amount: z.number().int().min(1, "1円以上で入力してください"),
  categoryId: z.string().cuid().nullable().optional(),
  memo: z.string().max(200, "200文字以内で入力してください").optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
```

### 4.2 React Hook Form + Zod 統合パターン

Client Components でのフォーム実装は、React Hook Form + Zod の統合パターンを使用する。
`@hookform/resolvers` でバリデーションを Zod スキーマに委譲し、Server Actions と同じスキーマを共用する。

```typescript
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentSchema, type PaymentInput } from "@/lib/validations/payment";

export function PaymentForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
  });

  const onSubmit = async (data: PaymentInput) => {
    const result = await createPayment(data);
    if (result.success) {
      toast.success("支払いを登録しました");
    } else {
      toast.error(result.error);
      // fieldErrors がある場合はフォームにインラインエラーを反映
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* フォームフィールド */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "登録中..." : "登録"}
      </Button>
    </form>
  );
}
```

- `resolver: zodResolver(paymentSchema)` でクライアントバリデーションを実行
- `isSubmitting` で送信中の二重送信を防止
- Server Actions 側でも同じ Zod スキーマで再検証する（クライアントの入力は信頼しない）

### 4.3 エラーメッセージは日本語

```typescript
// ✅ 日本語エラーメッセージ
z.string().min(1, "名前を入力してください").max(50, "50文字以内で入力してください")

// ❌ デフォルト英語メッセージ
z.string().min(1).max(50)
```

---

## 5. Git 運用ルール

### 5.1 ブランチ戦略

個人開発のため、シンプルなブランチモデルを採用:

- `main`: 本番デプロイ可能な状態
- `feature/[機能名]`: 新機能開発（`main` から分岐）
- `fix/[修正内容]`: バグ修正

```
main
├── feature/auth
├── feature/dashboard
└── fix/salary-cycle-calculation
```

### 5.2 コミットメッセージ規約

```
<type>: <subject>

<body>（任意）
```

**Type**:
- `feat`: 新機能追加
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: フォーマット修正
- `refactor`: 機能変更なしの改善
- `test`: テスト追加・修正
- `chore`: 環境・依存管理

**例**:
```
feat: 支払い一括登録ダイアログを実装

STEP1（カード・利用月・合計額入力）とSTEP2（カテゴリ別振り分け）の
2ステップダイアログを実装。振り分け合計の一致チェック付き。
```

---

## 6. テスト戦略

### vitest.config.ts 推奨設定

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./__tests__/setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

- `resolve.alias`: `@/` パスエイリアスを解決し、テストコード内でアプリケーションコードと同じインポートパスを使用可能にする
- `setupFiles`: テスト共通の初期化処理（RTL の cleanup、グローバルモック等）を配置する

### playwright.config.ts 推奨設定

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./__tests__/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

- `projects`: Chromium のみに限定（PRD の方針に準拠）
- `webServer`: テスト実行前に自動で開発サーバーを起動
- `testDir`: E2E テストファイルは `__tests__/e2e/` ディレクトリに配置

### 6.1 テストの種類と対象

| 種別 | ツール | 対象 | カバレッジ目標 |
|------|-------|------|--------------|
| 単体テスト | Vitest | ビジネスロジック、Zod スキーマ、ユーティリティ | 90% |
| コンポーネントテスト | Vitest + RTL | Client Components（フォーム、ダイアログ） | 80% |
| 統合テスト | Vitest | Server Actions（Prisma モック） | 70% |
| E2E テスト | Playwright (Chromium) | 主要ユーザーフロー | 主要フロー網羅 |

### 6.2 テストの書き方

```typescript
// テストラベルは日本語で記述
describe("calculateSalaryCycle", () => {
  it("payDay=25, month=2026-02 の場合、2/25〜3/24 のサイクルを返す", () => {
    const result = calculateSalaryCycle(25, "2026-02");
    expect(result.start).toEqual(new Date(2026, 1, 25));
    expect(result.end).toEqual(new Date(2026, 2, 24));
  });

  it("payDay=1 の場合、当月1日〜当月末日のサイクルを返す", () => {
    const result = calculateSalaryCycle(1, "2026-02");
    expect(result.start).toEqual(new Date(2026, 1, 1));
    expect(result.end).toEqual(new Date(2026, 1, 28));
  });
});
```

### 6.3 モック方針

- **Prisma**: `vitest-mock-extended` でモック
- **Supabase Auth**: テスト用ヘルパーでセッションをモック
- **外部 API**: MSW（Mock Service Worker）は不要（外部 API 呼び出しなし）

#### Supabase Auth モック実装パターン

```typescript
// __tests__/helpers/auth-mock.ts
import { vi } from "vitest";

export function mockAuthenticatedUser(userId = "test-user-id") {
  vi.mock("@/lib/supabase/server", () => ({
    createServerClient: vi.fn().mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        }),
      },
    }),
  }));
}
```

Server Actions の統合テストでは、上記ヘルパーを `beforeEach` で呼び出して認証済みユーザーをモックする:

```typescript
import { mockAuthenticatedUser } from "@/__tests__/helpers/auth-mock";

describe("createPayment", () => {
  beforeEach(() => {
    mockAuthenticatedUser("test-user-123");
  });

  it("支払いを正常に登録できる", async () => {
    // テスト本体
  });
});
```

---

## 7. 開発環境セットアップ

### 7.1 必要なツール

| ツール | バージョン | 備考 |
|--------|-----------|------|
| Node.js | 22.x | Dev Container に同梱 |
| npm | 10.x | Node.js に同梱 |
| Docker | 最新版 | Dev Container 実行用 |
| VS Code | 最新版 | Dev Container 拡張必須 |

### 7.2 セットアップ手順

```bash
# 1. リポジトリのクローン
git clone [URL]
cd kakeibo-app-v2

# 2. Dev Container で開く（VS Code）
# コマンドパレット → "Dev Containers: Reopen in Container"

# 3. 依存関係のインストール
npm install

# 4. 環境変数の設定
cp .env.example .env.local
# .env.local を編集（下記の環境変数テーブルを参照）

# 5. Prisma のセットアップ
npx prisma generate
npx prisma migrate dev

# 6. 開発サーバーの起動
npm run dev
```

#### .env.local に設定する環境変数

| 変数名 | 値の形式 | 取得場所 |
|--------|---------|---------|
| `DATABASE_URL` | `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` | Supabase Dashboard > Project Settings > Database > Connection string > URI（Transaction モード） |
| `DIRECT_URL` | `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres` | Supabase Dashboard > Project Settings > Database > Connection string > URI（Session モード） |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[project-ref].supabase.co` | Supabase Dashboard > Project Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...`（JWT 形式） | Supabase Dashboard > Project Settings > API > Project API keys > anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...`（JWT 形式） | Supabase Dashboard > Project Settings > API > Project API keys > service_role secret（通常は不要。RLS をバイパスする管理操作が必要な場合のみ使用） |

- `DATABASE_URL`: Prisma の通常クエリ用。PgBouncer（ポート 6543）経由のトランザクションプーリング接続
- `DIRECT_URL`: Prisma マイグレーション用。PgBouncer を経由しない直接接続（ポート 5432）
- `NEXT_PUBLIC_*` のプレフィックスが付く変数はクライアント側に公開される（RLS で保護されているため安全）

### 7.3 npm スクリプト

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 8. コードレビュー基準

### 8.1 レビューポイント

**機能性**:
- [ ] PRD の受け入れ条件を満たしているか
- [ ] エッジケースが考慮されているか（payDay=1, payDay=32 等）

**Server/Client 境界**:
- [ ] `"use client"` が必要最小限か
- [ ] Server Component で直接データ取得しているか

**セキュリティ**:
- [ ] Server Actions で Zod バリデーションしているか
- [ ] RLS が有効なテーブルにアクセスしているか

**UI/UX**:
- [ ] モバイルファーストで実装されているか
- [ ] 金額表示が `Intl.NumberFormat` で統一されているか
- [ ] エラーメッセージが日本語か

### 8.2 レビューコメントの優先度

- `[必須]`: マージ前に修正必須
- `[推奨]`: 修正推奨だがマージ可
- `[提案]`: 検討してほしい改善案
- `[質問]`: 理解のための質問
