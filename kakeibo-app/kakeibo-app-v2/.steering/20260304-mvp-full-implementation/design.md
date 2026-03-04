# 設計書

## アーキテクチャ概要

docs/architecture.md v1.3 に完全準拠。Next.js App Router のレイヤード構成を採用。

```
ブラウザ (Client Components)
  ↕ HTTP / Server Action
Next.js Server
  ├── middleware.ts (Supabase Auth セッション検証)
  ├── Server Components (Prisma 読み取り)
  └── Server Actions (Zod + Prisma CUD)
       ↕ SQL (PgBouncer)
Supabase PostgreSQL (RLS)
```

## コンポーネント設計

### 1. 認証基盤 (lib/supabase/, middleware.ts)

**責務**:
- Supabase Auth クライアントの生成（server/client/middleware）
- middleware.ts でのセッション検証・リダイレクト

**実装の要点**:
- `@supabase/ssr` の `createServerClient` / `createBrowserClient` を使用
- Edge Runtime 互換（middleware では Prisma 不使用）

### 2. Server Actions (lib/actions/)

**責務**:
- 各エンティティの CRUD 操作
- Zod バリデーション → Prisma 操作 → revalidatePath

**実装の要点**:
- 全て `ActionResult<T>` 型を返却（safeParse + try-catch）
- 認証チェック: Supabase Auth から userId を取得

### 3. Client Components (components/)

**責務**:
- フォーム入力・バリデーション（React Hook Form + Zod）
- インタラクション（D&D, ダイアログ, ステータス変更）
- トースト通知

**実装の要点**:
- `"use client"` は最小単位に分離
- Server Component の子として配置

### 4. ユーティリティ (lib/utils/)

**責務**:
- 給料サイクル計算
- 引き落とし日・確定日算出
- 自動ステータス判定
- 金額フォーマット
- 認証エラー日本語化

## データフロー

### 読み取り（Server Component）
```
page.tsx → Supabase Auth で userId 取得 → Prisma findMany → HTML 生成
```

### 書き込み（Server Action）
```
Client Component → Server Action → safeParse → Prisma CUD → revalidatePath → UI 再レンダリング
```

## エラーハンドリング戦略

docs/architecture.md セクション12 および docs/development-guidelines.md セクション1.4 に準拠:

- Server Actions: `ActionResult<T>` 型（safeParse + try-catch）
- Server Components: `error.tsx` でリトライ表示
- Client: `toast.error()` / フォームインラインエラー

## 依存ライブラリ

docs/architecture.md セクション11.2 に完全準拠。

## ディレクトリ構造

docs/repository-structure.md v1.3 に完全準拠。

## 実装の順序

### Phase 1: プロジェクトスキャフォールディング
Next.js 作成 → 依存インストール → 設定ファイル → Prisma → Supabase → 共通コード

### Phase 2: 認証（F-06）
middleware.ts → ログインページ → 新規登録 → パスワードリセット → ログアウト

### Phase 3: カテゴリ管理（F-05）+ クレジットカード管理（F-01）
**並列実装可能**: 両機能は独立しているため、サブエージェントで並列に実装

### Phase 4: 手取り管理（F-02）
Salary の CRUD + 金額プリセット

### Phase 5: 支払い管理（F-03）
Payment の CRUD + ステータス管理 + 繰り返し + 一括登録

### Phase 6: ダッシュボード（F-04）
サマリーカード + 支払い予定テーブル + 資金繰りセクション + 給料サイクル計算

### Phase 7: 品質チェック
lint + typecheck + build

## セキュリティ考慮事項

- RLS による行レベルアクセス制御
- Server Actions で必ず Zod 再検証
- 環境変数は `.env.local` で管理（Git 管理外）

## パフォーマンス考慮事項

- Server Components でデータ取得（JS バンドル削減）
- Recharts は Dynamic Import（`ssr: false`）
- Prisma Select で必要カラムのみ取得
