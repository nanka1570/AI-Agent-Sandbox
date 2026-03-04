# 技術仕様書 (Architecture Design Document)

| 項目 | 内容 |
|------|------|
| バージョン | v1.4 |
| 作成日 | 2026-03-04 |
| 更新日 | 2026-03-04 |
| ステータス | 承認済み |
| 対応PRD | product-requirements.md v1.8 |
| 対応機能設計書 | functional-design.md v1.2 |

## 改版履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| v1.0 | 2026-03-04 | 初版作成 |
| v1.1 | 2026-03-04 | レビュー指摘対応: Prisma スキーマ定義追加（セクション3.4）、.env.local テンプレート追記（セクション4.3）、Lighthouse メトリクス FCP/LCP に修正（セクション5.1）、タイムゾーン方針追加（セクション2.4）、エラーハンドリング戦略追加（セクション12）、CI/CD 追加（セクション13）、PgBouncer 説明追記（セクション3.2）、middleware.ts コード例追加（セクション7.2）、Route Groups 注記追加（セクション6.1）、DB インデックスをスキーマに統合 |
| v1.2 | 2026-03-04 | 対応機能設計書バージョンを v1.1 に更新、CI 型チェックコマンド名を `typecheck` に統一（セクション13.1, 13.3）、date-fns-tz を依存関係に追加（セクション1.2, 11.2）、Prisma スキーマに @map / @@map 追加で DB カラム名をスネークケースに統一（セクション3.4） |
| v1.3 | 2026-03-04 | 対応機能設計書バージョンを v1.2 に更新、date-fns-tz バージョン表記を `3.x` に統一（セクション1.2） |
| v1.4 | 2026-03-04 | MVP 実装完了後の実態反映: Prisma `6.x` → `7.x (@prisma/adapter-pg)` + Proxy 遅延初期化パターンに更新（セクション1.2, 3.2）、Zod `3.x` → `4.x (zod/v4)` に更新（セクション1.2）、datasource から `directUrl` 削除し `prisma.config.ts` で管理（セクション3.4）、Budget モデルを Post-MVP 注記に変更（セクション3.4）、依存関係一覧のバージョン更新（セクション11.2） |

---

## 1. テクノロジースタック

### 1.1 言語・ランタイム

| 技術 | バージョン | 選定理由 |
|------|-----------|---------|
| Node.js | 22.x (LTS) | Dev Container 標準ランタイム。LTS による安定性とセキュリティパッチ保証 |
| TypeScript | 5.x (strict mode) | 静的型付けによるコンパイル時バグ検出。strict mode で null 安全性を担保 |
| npm | 10.x | Node.js 22.x 同梱。package-lock.json による依存関係の厳密管理 |

### 1.2 フレームワーク・ライブラリ

| 技術 | バージョン | 用途 | 選定理由 |
|------|-----------|------|----------|
| Next.js | 15.x | フルスタックフレームワーク | App Router による Server Components / Server Actions。Vercel との最適統合 |
| React | 19.x | UI ライブラリ | Next.js 15 の標準。Server Components / Suspense のフル活用 |
| Tailwind CSS | v4 | スタイリング | ユーティリティファーストでモバイルファースト設計に最適。ビルド時最適化 |
| shadcn/ui | latest | UI コンポーネント | Radix UI ベースのアクセシブルなコンポーネント。コピー方式で自由にカスタマイズ可能 |
| Prisma | 7.x | ORM | 型安全な DB アクセス。`@prisma/adapter-pg` でドライバーアダプターを使用。スキーマファーストでデータモデルを定義 |
| @supabase/ssr | latest | 認証 | Supabase Auth の SSR 対応。middleware でのセッション管理。Edge Runtime 互換 |
| Recharts | 2.x | チャート | React ネイティブ。SVG ベースでレスポンシブ対応 |
| date-fns | 4.x | 日付操作 | Tree-shaking 対応で軽量。給料サイクル計算に必要な日付演算 |
| date-fns-tz | 3.x | タイムゾーン変換 | JST 基準の日付判定に必要 |
| React Hook Form | 7.x | フォーム管理 | 非制御コンポーネントベースで高パフォーマンス。再レンダリング最小化 |
| Zod | 4.x | バリデーション | TypeScript ファーストのスキーマバリデーション。`zod/v4` サブパスでインポート。Server Actions でも共用可能 |

### 1.3 開発ツール

| 技術 | バージョン | 用途 | 選定理由 |
|------|-----------|------|----------|
| Vitest | 2.x | 単体テスト | Vite ベースで高速。TypeScript ネイティブ対応 |
| React Testing Library | 16.x | コンポーネントテスト | ユーザー視点のテスト。アクセシビリティ重視 |
| Playwright | 1.x | E2E テスト | Chromium のみで軽量。CI での安定動作 |
| ESLint | 9.x | リンター | Flat Config 対応。Next.js 推奨ルールセット |
| Prettier | 3.x | フォーマッター | コードスタイルの自動統一 |
| Dev Container | - | 開発環境 | Node.js 22 ベース。チーム全員が同一環境で開発可能 |

---

## 2. アーキテクチャパターン

### 2.1 全体構成: Next.js App Router アーキテクチャ

```
┌───────────────────────────────────────────────┐
│                  ブラウザ                       │
│  ┌───────────────────────────────────────────┐ │
│  │  Client Components ("use client")         │ │
│  │  - フォーム入力・バリデーション             │ │
│  │  - インタラクション（D&D, ダイアログ等）    │ │
│  │  - チャート表示（Recharts）                │ │
│  └──────────────┬────────────────────────────┘ │
└─────────────────┼─────────────────────────────┘
                  │ HTTP / Server Action 呼び出し
┌─────────────────┼─────────────────────────────┐
│  Next.js Server │                              │
│  ┌──────────────┴────────────────────────────┐ │
│  │  middleware.ts                             │ │
│  │  - Supabase Auth セッション検証・更新       │ │
│  │  - 未認証リクエストのリダイレクト           │ │
│  └──────────────┬────────────────────────────┘ │
│  ┌──────────────┴────────────────────────────┐ │
│  │  Server Components (page.tsx / layout.tsx) │ │
│  │  - データ取得（Prisma 直接呼び出し）        │ │
│  │  - HTML レンダリング                       │ │
│  └──────────────┬────────────────────────────┘ │
│  ┌──────────────┴────────────────────────────┐ │
│  │  Server Actions ("use server")            │ │
│  │  - データ更新（CUD 操作）                  │ │
│  │  - Zod バリデーション                      │ │
│  │  - revalidatePath() によるキャッシュ再検証  │ │
│  └──────────────┬────────────────────────────┘ │
│  ┌──────────────┴────────────────────────────┐ │
│  │  Prisma Client（シングルトン）             │ │
│  │  - 型安全な DB クエリ                      │ │
│  └──────────────┬────────────────────────────┘ │
└─────────────────┼─────────────────────────────┘
                  │ SQL (Connection Pooling)
┌─────────────────┼─────────────────────────────┐
│  Supabase       │                              │
│  ┌──────────────┴────────────────────────────┐ │
│  │  PostgreSQL (RLS 有効)                     │ │
│  │  - Row Level Security: auth.uid() = userId │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │  Supabase Auth                            │ │
│  │  - JWT 発行・検証                          │ │
│  │  - メール+パスワード認証                    │ │
│  └───────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

### 2.2 レイヤー責務

| レイヤー | 責務 | 技術 | 許可される操作 | 禁止される操作 |
|---------|------|------|---------------|---------------|
| Client Components | UI インタラクション、フォーム入力 | React + shadcn/ui | Server Actions 呼び出し、ローカル状態管理 | Prisma 直接呼び出し、DB アクセス |
| middleware.ts | 認証チェック、セッション更新 | @supabase/ssr (Edge Runtime) | Supabase Auth API 呼び出し、リダイレクト | DB アクセス、ビジネスロジック |
| Server Components | データ取得、HTML 生成 | React Server Components + Prisma | Prisma 読み取り、子コンポーネントレンダリング | useState/useEffect、イベントハンドラ |
| Server Actions | データ更新、バリデーション | "use server" + Prisma + Zod | Prisma CUD、revalidatePath、リダイレクト | UI レンダリング |
| Prisma Client | DB アクセス抽象化 | Prisma ORM | SQL 生成・実行 | ビジネスロジック |
| PostgreSQL + RLS | データ永続化、アクセス制御 | Supabase PostgreSQL | データ保存・取得、行レベル権限制御 | — |

### 2.3 データフロー

#### 読み取り（Read）

```
ブラウザ → middleware.ts（認証チェック）
         → Server Component（page.tsx）
         → Prisma Client（findMany/findFirst）
         → PostgreSQL（RLS でユーザーフィルタ）
         → Server Component（HTML 生成）
         → ブラウザ（表示）
```

#### 書き込み（Create / Update / Delete）

```
Client Component（フォーム送信）
  → Server Action（Zod バリデーション）
  → Prisma Client（create/update/delete）
  → PostgreSQL（RLS でユーザー権限チェック）
  → Server Action（revalidatePath()）
  → ブラウザ（ページ再レンダリング）
```

### 2.4 タイムゾーン方針

| 項目 | 方針 |
|------|------|
| サーバー（Vercel） | UTC で動作 |
| DB 保存 | DateTime 型は UTC で保存 |
| 日付比較ロジック | JST（Asia/Tokyo）基準で判定 |
| 表示 | JST に変換して表示 |

- **ステータス自動設定**（引き落とし日・確定日と「今日」の比較）や**給料サイクル計算**は JST 基準で行う
- `new Date()` を直接使わず、`date-fns-tz` の `toZonedTime` を使用して JST の現在日時を取得する
- 日付のみの比較（YYYY-MM-DD レベル）では時刻部分を無視し、JST の日付で比較する

```typescript
// 例: JST の「今日」を取得
import { toZonedTime } from "date-fns-tz";

const TIMEZONE = "Asia/Tokyo";
const nowJST = toZonedTime(new Date(), TIMEZONE);
```

> **依存追加**: `date-fns-tz` を devDependencies ではなく dependencies に追加する。

---

## 3. データ永続化戦略

### 3.1 ストレージ方式

| データ種別 | ストレージ | フォーマット | 理由 |
|-----------|----------|-------------|------|
| ユーザー認証情報 | Supabase Auth | JWT + auth.users テーブル | マネージドサービスでセキュリティ担保 |
| アプリケーションデータ | Supabase PostgreSQL | リレーショナル | RLS による行レベルアクセス制御。Prisma による型安全クエリ |
| セッション | Supabase Auth Cookie | HTTP-only Cookie | @supabase/ssr で自動管理 |
| 一時的な UI 状態 | ブラウザメモリ | React state | ページ遷移で破棄される一時データ |

### 3.2 Prisma 接続管理

```typescript
// lib/prisma.ts - Proxy 遅延初期化パターン（Prisma 7 + @prisma/adapter-pg）
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

let prismaInstance: PrismaClient | undefined;

// Proxy による遅延初期化（ビルド時の PrismaClient 生成を回避）
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (process.env.NODE_ENV === "development") {
      if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = createPrismaClient();
      }
      const value = Reflect.get(globalForPrisma.prisma, prop);
      return typeof value === "function" ? value.bind(globalForPrisma.prisma) : value;
    } else {
      if (!prismaInstance) {
        prismaInstance = createPrismaClient();
      }
      const value = Reflect.get(prismaInstance, prop);
      return typeof value === "function" ? value.bind(prismaInstance) : value;
    }
  },
});
```

- **Proxy 遅延初期化**: `next build` 時に `DATABASE_URL` が不要。実際のクエリ時に初めて PrismaClient が生成される
- **@prisma/adapter-pg**: Prisma 7 のドライバーアダプター。`PrismaPg` が PostgreSQL 接続を管理する
- **開発環境**: `globalThis` にキャッシュして HMR 時のコネクション枯渇を防止
- **本番環境**: モジュールスコープのシングルトンを使用

#### 接続プール（PgBouncer）

Supabase は PgBouncer による接続プールを提供している。Vercel の Serverless Functions は関数呼び出しごとに新規接続を生成するため、接続プール経由でないとコネクション枯渇が発生する。

| 接続方式 | ポート | 用途 | 設定 |
|---------|-------|------|------|
| Transaction mode（PgBouncer） | 6543 | アプリケーション接続（`DATABASE_URL`） | `?pgbouncer=true` パラメータ必須 |
| Direct | 5432 | マイグレーション（`DIRECT_URL`） | PgBouncer を経由しない直接接続 |

- Prisma 7 では `prisma.config.ts` の `datasource.shadowDatabaseUrl` で直接接続 URL を指定し、マイグレーション時のみ直接接続を使用する（従来の `datasource.directUrl` は不要）
- PgBouncer の Transaction mode ではプリペアドステートメントが使えないため、`?pgbouncer=true` パラメータで Prisma にこれを通知する

### 3.3 バックアップ戦略

| 項目 | 方針 |
|------|------|
| 自動バックアップ | Supabase が日次で自動バックアップ（Pro プラン以上で Point-in-Time Recovery） |
| データ復元 | Supabase Dashboard から復元 |
| マイグレーション管理 | `prisma/migrations/` ディレクトリで Git 管理 |

### 3.4 Prisma スキーマ定義

PRD のデータモデルに基づく完全な Prisma スキーマ。インデックス定義（旧セクション 8.2）を各モデルに統合している。

```prisma
// Prisma 7: datasource の url は prisma.config.ts で管理
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
}

model Salary {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  payDay    Int      @map("pay_day")    // 支給日（1-31, 32=末日）
  amount    Int      // 手取り額（円）
  month     String   // 対象月 "YYYY-MM"
  memo      String?
  sortOrder Int      @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([userId, month]) // 月次手取り一覧
  @@map("salaries")
}

model CreditCard {
  id                      String    @id @default(cuid())
  userId                  String    @map("user_id")
  name                    String    // カード名
  closingDay              Int       @map("closing_day")          // 締め日（1-31, 32=末日）
  paymentDay              Int       @map("payment_day")          // 支払い日（1-31, 32=末日）
  paymentMonthOffset      Int       @map("payment_month_offset") // 支払月オフセット（0-2）
  confirmationDay         Int?      @map("confirmation_day")     // 確定日（null=未設定, 1-31, 32=末日）
  confirmationMonthOffset Int?      @map("confirmation_month_offset") // 確定日の月オフセット（0=当月, 1=翌月など）
  brand                   String?   // "visa"/"mastercard"/"jcb"/"amex"/"other"
  memo                    String?
  sortOrder               Int       @default(0) @map("sort_order")
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")

  payments Payment[]

  @@index([userId, sortOrder]) // ソート順での一覧取得
  @@map("credit_cards")
}

model Payment {
  id               String      @id @default(cuid())
  userId           String      @map("user_id")
  creditCardId     String      @map("credit_card_id")
  categoryId       String?     @map("category_id")
  month            String      // 利用月 "YYYY-MM"
  amount           Int         // 金額（円）
  status           String      @default("unconfirmed") // unconfirmed / confirmed / paid
  memo             String?
  isRecurring      Boolean     @default(false) @map("is_recurring")
  recurringGroupId String?     @map("recurring_group_id")
  sortOrder        Int         @default(0) @map("sort_order")
  createdAt        DateTime    @default(now()) @map("created_at")
  updatedAt        DateTime    @updatedAt @map("updated_at")

  creditCard CreditCard @relation(fields: [creditCardId], references: [id], onDelete: Cascade)
  category   Category?  @relation(fields: [categoryId], references: [id], onDelete: SetNull)

  @@index([userId, month])        // 月次支払い一覧
  @@index([userId, creditCardId]) // カード別支払い一覧
  @@index([recurringGroupId])     // 繰り返しグループ一括操作
  @@map("payments")
}

model Category {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  name      String   // カテゴリ名
  color     String   // 表示カラー（HEXコード形式。例: "#FF6384"）
  sortOrder Int      @default(0) @map("sort_order")
  isDefault Boolean  @default(false) @map("is_default")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  payments Payment[]

  @@index([userId, sortOrder]) // ソート順での一覧取得
  @@map("categories")
}

// Post-MVP: F-07 予算管理で Budget モデルを追加予定
// Budget モデルの設計は PRD で定義済み。実装時に Category への budgets リレーションも追加する。
```

> **注意**: Budget モデルは Post-MVP（F-07 予算管理）で追加予定。MVP スキーマには含まれていない。

---

## 4. 認証・セキュリティアーキテクチャ

### 4.1 認証フロー

```
1. ログイン / 新規登録
   ブラウザ → Supabase Auth API（メール + パスワード）
   Supabase Auth → JWT 発行 → Cookie にセット

2. 認証済みリクエスト
   ブラウザ → middleware.ts
   middleware → @supabase/ssr createServerClient でセッション検証
   セッション有効 → Server Component へ転送
   セッション無効 → /login へリダイレクト

3. セッション更新
   middleware.ts で毎リクエスト時にセッション自動更新
```

### 4.2 Row Level Security (RLS)

全テーブルに対して以下のポリシーを適用:

```sql
-- 例: payments テーブル
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own payments"
  ON payments FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own payments"
  ON payments FOR DELETE
  USING (auth.uid()::text = user_id);
```

### 4.3 環境変数管理

| 変数名 | 用途 | 公開範囲 |
|--------|------|---------|
| `DATABASE_URL` | Prisma DB 接続 | サーバーのみ |
| `DIRECT_URL` | Prisma マイグレーション用直接接続 | サーバーのみ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API エンドポイント | クライアント公開 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー（RLS で保護） | クライアント公開 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 管理用キー | サーバーのみ（使用は最小限） |

#### .env.local テンプレート

```env
# Supabase PostgreSQL 接続（Supabase Dashboard > Settings > Database から取得）
# Transaction mode（PgBouncer 経由、port 6543）- アプリケーション接続用
DATABASE_URL="postgresql://postgres.[ref]:[pw]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
# Direct 接続（port 5432）- Prisma マイグレーション専用
DIRECT_URL="postgresql://postgres.[ref]:[pw]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase API（Supabase Dashboard > Settings > API から取得）
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."

# Supabase Service Role Key（サーバーサイドのみ。管理操作が必要な場合のみ使用）
# SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

- `DATABASE_URL`: PgBouncer 経由の接続プール（Transaction mode, port 6543）。アプリケーションからの通常接続で使用する
- `DIRECT_URL`: PostgreSQL への直接接続（port 5432）。`prisma migrate dev` / `prisma migrate deploy` 等のマイグレーション実行時に Prisma が自動で使用する
- `[ref]` は Supabase プロジェクトのリファレンス ID、`[pw]` はデータベースパスワード、`[region]` は AWS リージョン

### 4.4 入力検証

```
Client Side: React Hook Form + Zod（UX向上のための即座のフィードバック）
Server Side: Server Actions 内で Zod スキーマ検証（信頼できる検証）
DB Level: RLS + NOT NULL / CHECK 制約（最終防御）
```

- クライアントの入力は信頼しない。Server Actions で必ず再検証する
- Zod スキーマは `lib/validations/` に配置し、クライアント・サーバーで共用する

---

## 5. パフォーマンス要件

### 5.1 レスポンスタイム

| 操作 | 目標値 | 測定方法 |
|------|--------|---------|
| ページ初回読み込み（FCP） | 1.8 秒以内 | Lighthouse First Contentful Paint |
| ページ初回読み込み（LCP） | 2.5 秒以内 | Lighthouse Largest Contentful Paint |
| Lighthouse Performance スコア | 90 以上 | Lighthouse Performance タブ |
| ページ遷移（App Router） | 300ms 以内 | ブラウザ DevTools Network |
| Server Action レスポンス | 500ms 以内 | Server Action 内の console.time |
| ダッシュボードデータ集計 | 500ms 以内 | Prisma クエリログ |

### 5.2 最適化戦略

| 戦略 | 適用箇所 | 詳細 |
|------|---------|------|
| Server Components | 全ページ | HTML をサーバーで生成し、JavaScript バンドルを削減 |
| Suspense + loading.tsx | データ取得ページ | Skeleton UI でストリーミング表示 |
| Dynamic Import | Recharts | チャートコンポーネントを遅延読み込み（`ssr: false`） |
| Prisma Select | DB クエリ | 必要なカラムのみ取得（`select` で指定） |
| revalidatePath | データ更新後 | ページ単位のキャッシュ再検証で最新データ表示 |

### 5.3 リソース使用量

| リソース | 上限 | 理由 |
|---------|------|------|
| JavaScript バンドル | 200KB (gzip) | モバイル回線での読み込み速度確保 |
| 初回 HTML | 50KB | SSR で必要最小限の HTML を送信 |
| Prisma コネクション | 10 接続 | Supabase Free プランのコネクション制限考慮 |

---

## 6. ルーティング設計

### 6.1 App Router ディレクトリ構造

> **注記**: 機能設計書（functional-design.md）のディレクトリ構成は簡略版です。実装時は以下の Route Groups 構成を採用します。

```
app/
├── (auth)/                    # Route Group: 認証不要
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── forgot-password/
│   │   └── page.tsx
│   ├── reset-password/
│   │   └── page.tsx
│   └── layout.tsx             # 認証レイアウト（ヘッダーなし）
├── (main)/                    # Route Group: 認証必須
│   ├── layout.tsx             # メインレイアウト（ナビゲーション付き）
│   ├── page.tsx               # ダッシュボード (/)
│   ├── loading.tsx
│   ├── error.tsx
│   ├── credit-cards/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── salary/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── payments/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   └── budget/
│       ├── page.tsx
│       ├── loading.tsx
│       └── error.tsx
├── layout.tsx                 # ルートレイアウト
├── not-found.tsx
└── globals.css
```

### 6.2 ナビゲーション

| 画面幅 | ナビ形式 | 項目 |
|--------|---------|------|
| モバイル（< 768px） | ボトムナビゲーション（固定） | ダッシュボード、支払い、手取り、カテゴリ |
| PC（≥ 768px） | ヘッダーナビゲーション | ダッシュボード、クレカ管理、手取り管理、支払い管理、カテゴリ/予算 |

切り替え: `md:` ブレークポイントで表示/非表示

---

## 7. Supabase 統合設計

### 7.1 Supabase クライアント

| 種類 | 用途 | ファイル |
|------|------|---------|
| Server Client | Server Components / Server Actions でのセッション操作 | `lib/supabase/server.ts` |
| Browser Client | Client Components でのログイン・ログアウト | `lib/supabase/client.ts` |
| Middleware Client | middleware.ts でのセッション検証・更新 | `lib/supabase/middleware.ts` |

### 7.2 middleware.ts 実装例

```typescript
// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // セッション更新（有効期限が近い場合にリフレッシュ）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 認証不要パス
  const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // 未認証ユーザーを /login にリダイレクト
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 認証済みユーザーが認証ページにアクセスした場合はダッシュボードへ
  if (user && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // 静的ファイルと Next.js 内部パスを除外
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### 7.3 認証エラーの日本語化

```typescript
// lib/auth/error-messages.ts
const AUTH_ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "メールアドレスまたはパスワードが正しくありません",
  "Email not confirmed": "メールアドレスが確認されていません",
  "User already registered": "このメールアドレスは既に登録されています",
  // ... 他のエラーメッセージ
};
```

---

## 8. スケーラビリティ設計

### 8.1 データ増加への対応

| 想定 | 数量 | 対策 |
|------|------|------|
| ユーザー数 | 個人利用（1 ユーザー） | RLS で分離済み。将来の複数ユーザー対応可 |
| クレジットカード | 最大 10 枚/ユーザー | インデックス不要な規模 |
| 月次支払い件数 | 最大 100 件/月 | Prisma の where 句で月次フィルタ |
| 累計支払い件数 | 年 1,200 件 → 5 年で 6,000 件 | `(userId, month)` 複合インデックスで検索高速化 |
| カテゴリ数 | 最大 30 件/ユーザー | インデックス不要な規模 |

### 8.2 DB インデックス設計

> セクション 3.4「Prisma スキーマ定義」に各モデルの `@@index` として統合済み。以下はインデックスの目的の要約。

| モデル | インデックス | 用途 |
|--------|------------|------|
| Payment | `[userId, month]` | 月次支払い一覧 |
| Payment | `[userId, creditCardId]` | カード別支払い一覧 |
| Payment | `[recurringGroupId]` | 繰り返しグループ一括操作 |
| Salary | `[userId, month]` | 月次手取り一覧 |
| Category | `[userId, sortOrder]` | ソート順での一覧取得 |
| CreditCard | `[userId, sortOrder]` | ソート順での一覧取得 |

### 8.3 機能拡張性

| 拡張機能 | 影響範囲 | 設計上の考慮 |
|---------|---------|------------|
| F-07 予算管理 | Budget テーブル追加、ダッシュボード拡張 | Budget モデルは PRD で定義済み。ダッシュボードは Card コンポーネント追加で対応 |
| F-08 レポート | `/reports` ページ追加、集計クエリ | Recharts は導入済み。Prisma groupBy で集計 |
| F-09 PWA | Service Worker、manifest.json | Next.js の PWA プラグインで対応 |
| F-10 CSV エクスポート | Server Action 追加 | ストリーミングレスポンスで大量データ対応 |

---

## 9. テスト戦略

### 9.1 テストピラミッド

```
        ╱ E2E テスト ╲        ← 少数・高コスト（主要フロー）
       ╱ 統合テスト    ╲       ← 中程度（Server Actions + Prisma）
      ╱  単体テスト      ╲     ← 多数・低コスト（ロジック・バリデーション）
```

### 9.2 テスト種別

| 種別 | ツール | 対象 | カバレッジ目標 |
|------|-------|------|--------------|
| 単体テスト | Vitest | ビジネスロジック（給料サイクル計算、ステータス判定）、Zod スキーマ、ユーティリティ関数 | 90% |
| コンポーネントテスト | Vitest + RTL | Client Components（フォーム、ダイアログ） | 80% |
| 統合テスト | Vitest | Server Actions + Prisma（モック使用） | 70% |
| E2E テスト | Playwright (Chromium) | 主要ユーザーフロー（ログイン → 支払い登録 → ダッシュボード確認） | 主要フロー網羅 |

### 9.3 テストファイル配置

```
__tests__/
├── unit/                   # 単体テスト
│   ├── lib/
│   │   ├── salary-cycle.test.ts
│   │   ├── status.test.ts
│   │   └── validations/
│   └── components/
├── integration/            # 統合テスト
│   └── actions/
│       ├── payment-actions.test.ts
│       └── salary-actions.test.ts
└── e2e/                    # E2E テスト
    ├── auth.spec.ts
    ├── payment-flow.spec.ts
    └── dashboard.spec.ts
```

---

## 10. 技術的制約

### 10.1 環境要件

| 項目 | 要件 |
|------|------|
| 開発環境 | Dev Container (Node.js 22) |
| 本番環境 | Vercel (Node.js Runtime) |
| DB | Supabase PostgreSQL (Free プラン: 500MB, 2 プロジェクト) |
| ブラウザ | Chrome / Safari / Firefox 最新版 |

### 10.2 Vercel 制約

| 制約 | 上限 | 対策 |
|------|------|------|
| Serverless Function 実行時間 | 10 秒 (Hobby) | 重い集計は DB 側で実行 |
| Serverless Function サイズ | 50MB | Prisma Client のバンドル最適化 |
| Edge Function | Prisma 使用不可 | middleware.ts では Supabase Auth のみ使用 |

### 10.3 Supabase 制約（Free プラン）

| 制約 | 上限 | 対策 |
|------|------|------|
| DB サイズ | 500MB | 個人利用では十分 |
| API リクエスト | 500K/月 | 個人利用では十分 |
| 同時接続 | 60 | Prisma コネクションプール制限で対応 |
| 1 週間非アクティブ | プロジェクト一時停止 | 定期的なアクセスまたは Pro プランへの移行 |

---

## 11. 依存関係管理

### 11.1 バージョン管理方針

| カテゴリ | 方針 | 例 |
|---------|------|-----|
| フレームワーク (Next.js, React) | メジャーバージョン固定、マイナー自動 | `^15.0.0` |
| ORM (Prisma) | メジャーバージョン固定、マイナー自動 | `^7.0.0` |
| UI (shadcn/ui) | コピー方式のため依存なし | — |
| ユーティリティ (date-fns, Zod) | マイナーバージョンまで許可 | `^4.0.0` |
| 開発ツール (Vitest, ESLint, Prettier) | パッチバージョンのみ自動 | `~2.0.0` |

### 11.2 主要依存関係一覧

| ライブラリ | 用途 | バージョン管理 |
|-----------|------|--------------|
| next | フレームワーク | `^15.0.0` |
| react / react-dom | UI | `^19.0.0` |
| @prisma/client | ORM クライアント | `^7.0.0` |
| @prisma/adapter-pg | Prisma PostgreSQL ドライバーアダプター | `^7.0.0` |
| @supabase/ssr | 認証（SSR） | `^0.5.0` |
| @supabase/supabase-js | Supabase クライアント | `^2.0.0` |
| tailwindcss | スタイリング | `^4.0.0` |
| recharts | チャート | `^2.0.0` |
| date-fns | 日付操作 | `^4.0.0` |
| date-fns-tz | タイムゾーン変換 | `^3.0.0` |
| react-hook-form | フォーム | `^7.0.0` |
| zod | バリデーション | `^4.0.0` |
| @hookform/resolvers | RHF + Zod 統合 | `^3.0.0` |
| sonner | トースト通知 | `^2.0.0` |
| @dnd-kit/core | ドラッグ&ドロップ | `^6.0.0` |

### 11.3 セキュリティ更新

- `npm audit` を CI で定期実行（weekly）
- Critical / High の脆弱性は即時対応
- Dependabot による自動 PR 作成（GitHub 設定）

---

## 12. エラーハンドリング戦略

### 12.1 エラー種別と対応方法

| エラー種別 | 対応方法 | コンポーネント |
|-----------|---------|--------------|
| Server Component データ取得失敗 | error.tsx でリトライボタン表示 | `app/**/error.tsx` |
| Server Action 検証エラー | フォームにインライン表示 | 各フォーム（React Hook Form の `setError`） |
| Server Action DB エラー | トースト通知で表示 | sonner（`toast.error()`） |
| 認証切れ | `/login` にリダイレクト | `middleware.ts` |
| 404 | not-found.tsx で表示 | `app/not-found.tsx` |

### 12.2 error.tsx の実装方針

- `"use client"` 必須（Error Boundary は Client Component）
- `reset()` 関数でリトライ機能を提供
- エラーメッセージはユーザーフレンドリーな日本語で表示
- 開発環境ではエラー詳細をコンソールに出力

### 12.3 Server Action のエラーレスポンス

```typescript
// Server Action の戻り値型
type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
```

- Zod バリデーションエラー: `fieldErrors` にフィールド単位のエラーを格納し、フォームにインライン表示
- DB エラー・予期しないエラー: `error` に汎用メッセージを格納し、トーストで通知
- クライアントでは `success` フラグで分岐処理する

---

## 13. CI/CD

### 13.1 GitHub Actions 推奨設定

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
```

### 13.2 デプロイフロー

| 環境 | トリガー | URL |
|------|---------|-----|
| Preview | Pull Request 作成・更新 | Vercel が自動生成（`*.vercel.app`） |
| Production | `main` ブランチへのマージ | カスタムドメインまたは Vercel デフォルト |

### 13.3 CI チェック項目

| チェック | コマンド | 失敗時の扱い |
|---------|---------|------------|
| リント | `npm run lint` | PR マージブロック |
| 型チェック | `npm run typecheck` | PR マージブロック |
| 単体テスト | `npm run test` | PR マージブロック |
| ビルド | `npm run build` | PR マージブロック |
| E2E テスト | `npx playwright test` | 警告（Preview 環境で手動確認） |
