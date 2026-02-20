# kakeibo-app（家計簿アプリ）

給料日とクレジットカードの支払日を管理し、収支を可視化する個人向け家計簿Webアプリ。

## 機能

- **ダッシュボード** — 給料合計・支払い合計・残額のサマリー、支払い予定一覧、月次推移グラフ、クレカ別支出グラフ
- **クレジットカード管理** — カードの登録・編集・削除（締め日・支払い日）
- **給料管理** — 月別の給料登録・編集・削除
- **支払い管理** — クレカ別の支払い登録、ステータス管理（未確定→確定→支払い済み）

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| DB | SQLite (Prisma v7) |
| UI | shadcn/ui + Tailwind CSS v4 |
| グラフ | Recharts |
| バリデーション | Zod v4 + React Hook Form |
| テスト | Vitest + React Testing Library + Playwright |

## セットアップ

```bash
# 依存インストール
npm install

# DB作成
npx prisma db push

# Prisma Client生成
npx prisma generate

# 開発サーバー起動
npm run dev
```

http://localhost:3000 でアクセス。

## テスト

```bash
# 単体テスト + コンポーネントテスト（79件）
npm test

# E2Eテスト（3件）※ 開発サーバー起動中に実行
npm run test:e2e
```

## ディレクトリ構成

```
kakeibo-app/
├── src/
│   ├── app/                  # Next.js App Router ページ
│   │   ├── page.tsx          # ダッシュボード
│   │   ├── credit-cards/     # クレカ管理
│   │   ├── salary/           # 給料管理
│   │   └── payments/         # 支払い管理
│   ├── components/           # UIコンポーネント
│   ├── lib/
│   │   ├── actions/          # Server Actions（CRUD）
│   │   ├── db.ts             # Prisma クライアント
│   │   ├── dashboard.ts      # ダッシュボード集計ロジック
│   │   └── utils.ts          # ユーティリティ関数
│   ├── types/                # Zodスキーマ・型定義
│   └── generated/prisma/     # Prisma生成コード
├── prisma/
│   └── schema.prisma         # データモデル定義
├── __tests__/                # 単体・コンポーネントテスト
├── e2e/                      # E2Eテスト
└── docs/                     # 設計ドキュメント
```

## ドキュメント

| No. | ドキュメント |
|-----|-------------|
| 01 | 要件定義書 |
| 02 | 基本設計書 |
| 03 | 画面設計書 |
| 04 | 詳細設計書 |
| 05 | テスト計画書 |
| 06 | テスト環境構築手順書 |
| 07 | テスト仕様書 |
| 08 | テスト結果報告書 |
