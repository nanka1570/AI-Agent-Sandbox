# 開発ガイドライン (Development Guidelines)

| 項目 | 内容 |
|------|------|
| プロダクト | kakeibo-app v3 |
| バージョン | v1.0 |
| 作成日 | 2026-04-17 |

## コーディング規約

### 言語・フォーマット

- TypeScript 5 strict モード
- インデント: 2 スペース
- 行の長さ: 120 文字以内（Prettier の printWidth: 120）
- セミコロン: あり
- クォート: シングルクォート（JSX は属性でダブル）
- Prettier + ESLint を保存時に実行

### 命名規則

#### 変数・関数

```typescript
// ✅ 良い例: 名詞で始まる変数、動詞で始まる関数
const unpaidPaymentsTotal = calculateUnpaidTotal(payments);
function getAvailableMoney(userId: string, asOf: Date) { }

// ❌ 悪い例
const data = fetch();
function calc(arr: any[]) { }
```

**原則**:
- 変数: camelCase、名詞または名詞句
- 関数: camelCase、動詞で始める
- 定数（モジュールレベル）: UPPER_SNAKE_CASE（例: `DEFAULT_CATEGORIES`）
- Boolean: `is` / `has` / `should` で始める（例: `isRecurring`, `hasStatement`）

#### クラス・インターフェース・型

```typescript
// コンポーネント: PascalCase
export function PaymentForm({ ... }: PaymentFormProps) { }

// Zod スキーマ: PascalCase + Schema
export const PaymentSchema = z.object({ ... });

// 型: PascalCase
export type PaymentInput = z.infer<typeof PaymentSchema>;

// ステータス: リテラルユニオン
export type PaymentStatus = 'unconfirmed' | 'confirmed' | 'paid';
```

#### React コンポーネント

- ファイル名: kebab-case（例: `payment-form.tsx`）
- エクスポート名: PascalCase（例: `PaymentForm`）
- Props 型: `[Component]Props`（例: `PaymentFormProps`）
- Client Component は先頭に `'use client';` を明記

### コメント規約

**原則**: コードが自己説明的になるよう命名を優先し、コメントは「なぜ」を書く時だけ。

```typescript
// ✅ 良い例: なぜそうするか
// カレンダー側の楽観更新と整合性を取るため、usageDate はローカルタイムで保持
const usageDate = startOfDay(input.usageDate);

// ❌ 悪い例: 何をしているか（コードを見れば分かる）
// usageDate を設定する
const usageDate = input.usageDate;
```

**JSDoc**: ドメインロジック（`lib/utils/*`）の公開関数には簡潔な JSDoc を付与。

```typescript
/**
 * 現在の AvailableMoney を算出する。
 *
 * @param userId - 対象ユーザー ID
 * @param asOf - 計算基準日（デフォルトは今日）
 * @returns total と breakdown（4 要素）
 */
export async function getAvailableMoney(userId: string, asOf: Date = new Date()) { ... }
```

### Next.js App Router ルール

#### Server / Client Components

- **デフォルトは Server Component**（`'use client'` を書かない）
- `'use client'` は以下の場合のみ付与:
  - `useState` / `useEffect` / `useRef` などの React Hook
  - `onClick` / `onChange` などのイベントハンドラ
  - ブラウザ API（`window`, `localStorage`, `document`）
- Client Component は最小単位に分離し、Server Component の子として配置

#### ファイル規約

- `page.tsx` — ページ
- `layout.tsx` — レイアウト
- `loading.tsx` — Suspense フォールバック（Skeleton UI）
- `error.tsx` — エラーバウンダリ（`'use client'` 必須）
- `not-found.tsx` — 404

#### データ取得・更新

- **取得**: Server Component 内で直接 Prisma を呼ぶ
- **更新**: Server Actions（`'use server'`）を使用
- クライアントからの REST API 呼び出しは原則不要（`app/api/` は MVP では作らない）

### Server Actions 実装パターン

全 Server Action は以下のテンプレートに従う:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { PaymentSchema, type PaymentInput } from '@/lib/validations/payment';

export async function createPayment(input: PaymentInput) {
  // 1. 認証
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'ログインが必要です' };

  // 2. バリデーション
  const parsed = PaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: '入力内容に誤りがあります', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // 3. ドメインロジック
  const month = derivePaymentMonth(parsed.data); // lib/utils/
  const status = determineAutoStatus(parsed.data); // lib/utils/

  // 4. DB 操作
  try {
    const payment = await prisma.payment.create({
      data: { ...parsed.data, userId: user.id, month, status },
    });

    // 5. 再生成
    revalidatePath('/payments');
    revalidatePath('/calendar');
    revalidatePath('/');

    return { success: true, data: payment };
  } catch (e) {
    console.error(e);
    return { success: false, error: '登録できませんでした' };
  }
}
```

### Zod スキーマ運用

- 1 リソース 1 ファイル（`lib/validations/payment.ts`）
- スキーマから型を `z.infer` で導出
- エラーメッセージは日本語

```typescript
export const PaymentSchema = z
  .object({
    usageDate: z.coerce.date({ errorMap: () => ({ message: '利用日を入力してください' }) }),
    amount: z.number().int().positive('金額は 1 円以上で入力してください'),
    categoryId: z.string().uuid('カテゴリを選択してください'),
    creditCardId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    memo: z.string().max(200).optional(),
    isRecurring: z.boolean().default(false),
  })
  .refine((d) => !!d.creditCardId !== !!d.accountId, {
    message: '支払元（カードまたは口座）のどちらか一方を選択してください',
    path: ['creditCardId'],
  });

export type PaymentInput = z.infer<typeof PaymentSchema>;
```

### エラーハンドリング

- Server Action は常に `ActionResult<T>` 型を返す（例外を throw しない）
- 予期しないエラーはサーバーログに出力し、ユーザーには汎用メッセージ
- エラーバウンダリ（`error.tsx`）は予期しない例外のみ捕捉

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
```

### ログ

- サーバーサイドエラー: `console.error` で出力（Vercel Functions ログに収集）
- 機密情報（パスワード、トークン、個人金額）はログに残さない

## Git 運用ルール

### ブランチ戦略

- `main`: 本番相当、常にデプロイ可能
- `feature/[機能名]`: 新機能
- `fix/[修正内容]`: バグ修正
- `refactor/[対象]`: リファクタリング
- `docs/[内容]`: ドキュメントのみ

PR は `main` に向けて作成。MVP 期間中は `develop` ブランチは作らない。

### コミットメッセージ規約

**フォーマット**:
```
<type>(<scope>): <subject>
```

**Type**（グローバルルール準拠）:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: コードフォーマット（挙動に影響しない）
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド・補助ツール

**例**:
```
feat(payments): CSV インポート機能を追加
fix(statement): 差額計算で withdrawn 済みを除外
refactor(dashboard): AvailableMoneyCard を breakdown と分離
test(available-money): Statement 対象外ケースを追加
```

### PR テンプレート

```markdown
## 概要
[変更の要約]

## 変更理由
[なぜこの変更が必要か]

## 変更内容
- [変更点 1]
- [変更点 2]

## 検証
- [ ] `npx tsc --noEmit` パス
- [ ] `npx eslint .` パス
- [ ] `npx vitest run` パス
- [ ] `npx next build` パス
- [ ] （UI 変更時）`npx playwright test --headed` で該当シナリオ確認

## スクリーンショット
[UI 変更がある場合]

## 関連ドキュメント
[更新した docs/ のリンクや issue]
```

## テスト戦略

詳細は `06_test-plan.md` を参照。ここでは実装者向けの原則のみ。

### ユニットテスト（Vitest）

**対象**:
- `lib/utils/*` の全関数（純粋関数なので容易）
- 主要 Client Components（Form 系）

**カバレッジ目標**: `lib/utils/` は 90% 以上

**例**:
```typescript
import { describe, it, expect } from 'vitest';
import { getAvailableMoney } from '@/lib/utils/available-money';

describe('getAvailableMoney', () => {
  it('Statement 未登録のカードは ΣPayment をそのまま減算する', () => {
    const result = getAvailableMoney(/* fixtures */);
    expect(result.total).toBe(/* expected */);
  });

  it('withdrawnAmount 入力済み Statement は計算から除外される', () => {
    // ...
  });
});
```

### 統合テスト（Vitest + テスト DB）

**対象**: Server Actions の正常系・主要異常系

**セットアップ**: テスト用 Supabase プロジェクトか SQLite メモリ DB を使い分ける。

### E2E テスト（Playwright）

**実行コマンド**:
```bash
npx playwright test --headed --reporter=list
```

- `--headed` 必須（ブラウザ表示しながら実行）
- reporter は list（コンソールで進捗が見やすい）
- chromium のみ（他ブラウザは MVP 外）

### テスト命名規則

テストラベルは日本語で記述する:

```typescript
describe('getAvailableMoney', () => {
  it('全 Account.balance の合計が accountsTotal に反映される', () => { });
  it('未到来の給料日は incomingSalary に算入される', () => { });
  it('引落日経過済 Payment は unpaidPayments から除外される', () => { });
});
```

## コードレビュー基準

### セルフレビュー（PR 作成前）

- [ ] 全テストがパス
- [ ] Lint エラーなし、型チェックパス
- [ ] デバッグ用 `console.log` が残っていない
- [ ] 不要なコメントアウトされたコードがない
- [ ] 新規機能にテストを追加した
- [ ] ドキュメント（主に機能設計書・PRD）に齟齬がないか確認

### レビュー観点

**機能性**:
- 要件（PRD の受け入れ条件）を満たしているか
- エッジケース（空状態、最大値、境界値）を考慮しているか
- エラーハンドリングが適切か

**可読性**:
- 命名が明確か
- 複雑なロジックに「なぜ」コメントがあるか

**保守性**:
- 重複コードがないか
- ドメインロジック（`lib/utils/`）と DB 操作（`lib/actions/`）が分離されているか

**セキュリティ**:
- Server Action で `auth.uid()` 検証済みか
- ユーザー入力が Zod 検証を通っているか
- RLS ポリシーに依存した `user_id` 絞り込みになっているか

**パフォーマンス**:
- N+1 クエリが発生していないか
- 不要な Client Component になっていないか（Server Component で足りるか）

### レビューコメント

建設的なフィードバックを心がける。優先度を明示:
- `[必須]`: 修正必須
- `[推奨]`: 修正推奨
- `[提案]`: 検討してほしい
- `[質問]`: 理解のための質問

## 開発環境セットアップ

### 必要なツール

| ツール | バージョン | インストール方法 |
|--------|-----------|-----------------|
| Node.js | 22 LTS | nvm install 22 |
| npm | 10.x | Node.js 付属 |
| Git | 2.x | `sudo apt install git` |
| VS Code | latest | 推奨 |
| Dev Container CLI | - | VS Code 拡張 |

### セットアップ手順

```bash
# 1. リポジトリのクローン
git clone <repo-url>
cd kakeibo-app-v3

# 2. 依存関係のインストール
npm install

# 3. Playwright ブラウザ
npx playwright install chromium

# 4. 環境変数
cp .env.example .env.local
# .env.local を編集（Supabase URL・キー、DATABASE_URL を設定）

# 5. Prisma クライアント生成 + マイグレーション
npx prisma generate
npx prisma migrate dev

# 6. シード（デフォルトカテゴリ投入）
npx prisma db seed

# 7. 開発サーバー起動
npm run dev
```

### Playwright WSL 対応

WSL 環境では `npx playwright install --with-deps` が失敗する（sudo が必要）。代わりに:

```bash
# ブラウザだけ DL
npx playwright install chromium

# システムライブラリを手動で入れる
sudo apt-get install -y \
  libnspr4 libnss3 libatk1.0-0t64 libatk-bridge2.0-0t64 \
  libcups2t64 libdrm2 libxkbcommon0 libatspi2.0-0t64 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
  libgbm1 libpango-1.0-0 libcairo2 libasound2t64
```

### 推奨 VS Code 拡張

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma
- Playwright Test for VS Code

## 品質ゲート（CI / ローカル）

PR を出す前に以下を全てパスさせる:

```bash
npx tsc --noEmit            # 型チェック
npx eslint .                # Lint
npx prettier --check .      # フォーマット確認
npx vitest run              # 単体・統合テスト
npx next build              # ビルド確認
npx playwright test --headed --reporter=list  # E2E（UI 変更時）
```

package.json の scripts に集約する想定:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test --headed --reporter=list",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "prisma db seed",
    "check-all": "npm run typecheck && npm run lint && npm run test && npm run build"
  }
}
```

## 禁止事項

- `dangerouslySetInnerHTML` の使用
- `any` 型の安易な使用（どうしても必要なら `// eslint-disable-next-line` でコメント理由付き）
- ESLint / TypeScript エラーを `ignore` 設定で握り潰す
- Supabase Service Role Key を Client Component に渡す
- Prisma を Client Component で直接使用する
- `.env.local` を Git コミットする
- 機密情報（API キー・パスワード）をソースコードに直書きする
- `--no-verify` で pre-commit フックをスキップする（hook 失敗時は原因を修正）
