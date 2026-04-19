# kakeibo-app v3 プロジェクト設定

## コンセプト

銀行残高 + 手取り − 全支払い = **使えるお金** を 1 つの数字で可視化する家計簿アプリ。
最重要差別化機能はクレジットカードの **誤差ゼロ照合**（利用明細の積み上げ ↔ 確定請求額）。

## 技術スタック

| カテゴリ | 選定 |
|---------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript 5 (strict mode) |
| UI | Tailwind CSS v4 + shadcn/ui (new-york / neutral) |
| DB | Prisma 7 + Supabase PostgreSQL |
| 認証 | Supabase Auth (@supabase/ssr) |
| チャート | Recharts |
| 日付 | date-fns |
| フォーム | React Hook Form + Zod |
| CSV | papaparse |
| テスト | Vitest + React Testing Library + Playwright (chromium) |
| ランタイム | Node.js 22 |

## 8 文書体系

スペック駆動開発。全設計 → 全実装 → 全テストの厳密ウォーターフォール。

| # | ドキュメント | 役割 |
|---|------------|------|
| 01 | product-requirements.md | PRD（機能要件 F-01〜F-11） |
| 02 | functional-design.md | ER 図、Server Action シグネチャ、UI レイアウト |
| 03 | architecture.md | 技術選定理由、レイヤー構成、デプロイ |
| 04 | repository-structure.md | ディレクトリ構成 |
| 05 | development-guidelines.md | コーディング規約、Git、PR テンプレ |
| 06 | test-plan.md | テスト計画（単体 / 統合 / コンポーネント / E2E） |
| 07 | glossary.md | 用語集（AvailableMoney 公式、ステータス定義） |
| 08 | test-result-report.md | Phase 8 で記入 |

## Next.js App Router ルール

- デフォルトは Server Component（`"use client"` を書かない）
- `"use client"` は React Hook / イベントハンドラ / ブラウザ API を使う時のみ
- Client Component は最小単位に分離、Server Component の子として配置
- データ取得: Server Component 内で直接 Prisma を呼ぶ
- データ更新: Server Actions（`"use server"`）

### ファイル規約
- `page.tsx` / `layout.tsx` / `loading.tsx` / `error.tsx`（`"use client"` 必須）/ `not-found.tsx`

## Supabase / Prisma ルール

- 全テーブルで RLS 有効化、ポリシー `auth.uid() = user_id`
- `@supabase/ssr` の `createServerClient` / `createBrowserClient`
- `middleware.ts` で認証チェック + セッション更新、未認証は `/login` へ
- Prisma 7: `@prisma/adapter-pg` 必須、`import { PrismaClient } from "@prisma/client"`

## テスト規約

- 単体: Vitest + React Testing Library（テストラベル日本語）
- E2E: Playwright（chromium のみ、`--headed` 実行）
- E2E コマンド: `npx playwright test --headed --reporter=list`

## 品質ゲート

```bash
npx tsc --noEmit         # 型チェック
npx eslint .             # lint
npx next build           # ビルド
npx vitest run           # 単体/統合
npx playwright test --headed --reporter=list  # E2E
```

## 注意事項

- このファイルはプロジェクト固有のルールのみ
- グローバルルールは `~/.claude/CLAUDE.md` を参照
- v2（`../kakeibo-app-v2/`）は参考。ただし v3 はゼロから新規作成
