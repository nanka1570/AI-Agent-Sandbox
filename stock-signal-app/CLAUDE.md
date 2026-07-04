@AGENTS.md

# stock-signal-app プロジェクト設定

米国テクノロジー株（NASDAQ-100）の売買タイミングをテクニカル指標で提示し、銘柄の健全性をファンダメンタルズでスコア化する Web アプリ。個人用ローカルツール（認証なし）。

## 技術スタック

| カテゴリ | 選定 |
|---------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript (strict mode) |
| UI | Tailwind CSS v4 |
| DB | Prisma 7 + SQLite（`@prisma/adapter-better-sqlite3`） |
| データ取得 | yahoo-finance2（非公式 API・キー不要） |
| チャート | Recharts |
| テスト | Vitest + React Testing Library + Playwright (chromium) |

## プロジェクト固有ルール

### データの扱い
- **価格はすべて `adjClose`（調整後終値）を使う**（指標計算・シグナル・バックテスト・チャート表示）。生の `close` は株式分割で不連続になるため使わない
- `DailyPrice.date` は UTC 00:00 に正規化して保存
- yahoo-finance2 への依存は `lib/data/` に隔離する（非公式 API のため差し替え可能に保つ）
- データ同期は「1 リクエスト = 1 銘柄」方式（`POST /api/sync/[ticker]`）。upsert で冪等

### Prisma
- generator は `prisma-client`、出力先 `generated/prisma`（gitignore 済み）
- import は `@/generated/prisma/client` から
- クライアントは `lib/prisma.ts` のシングルトンを使う
- マイグレーション: `npx prisma migrate dev`

### 計算ロジック
- `lib/indicators/`・`lib/signals/`・`lib/backtest/`・`lib/fundamentals/` は純粋関数で実装し、DB や API に依存させない（単体テストの中心）
- シグナルルールは統合せず、ルール別（ゴールデンクロス / RSI）に独立して扱う

### UI
- Server Component がデフォルト。`"use client"` は Hook・イベントハンドラ使用時のみ
- 実装前に `node_modules/next/dist/docs/` の該当ガイドを確認する（Next.js 16 は破壊的変更あり）
- シグナルは投資判断の参考情報である旨を UI に明記（バックテストは手数料・税を含まない）

## テスト規約

- E2E は外部 API に依存させない（シードスクリプトで人工データを投入して実行）
- E2E 実行コマンド: `npx playwright test --headed --reporter=list`
- テストラベルは日本語で記述

## 注意事項

- 設計判断・シグナル仕様: `docs/design-decisions.md`、運用手順: `docs/maintenance.md`（人間向けドキュメント。仕様変更時はここも更新する）
- スペック駆動開発の基本ルールは `~/.claude/CLAUDE.md`（グローバル設定）を参照
