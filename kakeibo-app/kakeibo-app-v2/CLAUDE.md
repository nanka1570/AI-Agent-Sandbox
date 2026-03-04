# kakeibo-app v2 プロジェクト設定

## 技術スタック

| カテゴリ | 選定 |
|---------|------|
| フレームワーク | Next.js (App Router) |
| 言語 | TypeScript (strict mode) |
| UI | Tailwind CSS v4 + shadcn/ui |
| DB | Prisma + Supabase PostgreSQL |
| 認証 | Supabase Auth (@supabase/ssr) |
| チャート | Recharts |
| 日付 | date-fns |
| フォーム | React Hook Form + Zod |
| テスト | Vitest + React Testing Library + Playwright |
| リンター | ESLint + Prettier |
| ホスティング | Vercel |
| 開発環境 | Dev Container (Node.js 22) |

## Next.js App Router ルール

### Server Components / Client Components

- デフォルトは Server Component（`"use client"` を書かない）
- `"use client"` は以下の場合のみ付与:
  - useState, useEffect 等の React Hook を使用する
  - onClick 等のイベントハンドラを使用する
  - ブラウザ API を使用する
- Client Component は最小単位に分離し、Server Component の子として配置

### ファイル規約（App Router）

- `page.tsx` - ページコンポーネント
- `layout.tsx` - レイアウト
- `loading.tsx` - Suspense フォールバック（Skeleton UI）
- `error.tsx` - エラーバウンダリ（`"use client"` 必須）
- `not-found.tsx` - 404 ページ

### データ取得・更新

- データ取得: Server Component 内で直接 Prisma を呼ぶ
- データ更新: Server Actions（`"use server"`）を使用
- クライアントからの REST API 呼び出しは原則不要

## Supabase ルール

### 認証

- `@supabase/ssr` の `createServerClient` / `createBrowserClient` を使用
- middleware.ts で認証チェック + セッション更新
- 未認証ユーザーは `/login` にリダイレクト

### Row Level Security (RLS)

- 全テーブルで RLS を有効化
- ポリシー: `auth.uid() = user_id` で行レベルアクセス制御

## Prisma ルール

- スキーマファイル: `prisma/schema.prisma`
- クライアントはシングルトンで管理
- マイグレーション: `npx prisma migrate dev`

## UI ルール

- shadcn/ui コンポーネントは `components/ui/` に配置
- レスポンシブ: モバイルファースト（Tailwind の `sm:`, `md:`, `lg:` で拡張）
- PC: ヘッダーナビ、モバイル: ボトムナビ
- 金額表示: `Intl.NumberFormat('ja-JP')` で円表示
- 操作結果はトースト通知でフィードバック

## テスト規約

- 単体テスト: Vitest + React Testing Library
- E2E テスト: Playwright（chromium のみ）
- テストラベルは日本語で記述

## 注意事項

- このファイルはプロジェクト固有のルールのみ記載
- スペック駆動開発の基本ルール、ディレクトリ構造、開発プロセスは `~/.claude/CLAUDE.md`（グローバル設定）を参照
- 詳細なアーキテクチャは `docs/architecture.md` 作成後に追記予定
