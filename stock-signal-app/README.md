# stock-signal-app

米国テクノロジー株（NASDAQ-100 全銘柄 + NYSE 上場の主要テック 16 銘柄）の売買タイミングをテクニカル指標で提示し、銘柄の健全性をファンダメンタルズ指標でスコア化する Web アプリ。過去データで戦略を検証するバックテスト機能付き。

個人用のローカルツールです（認証なし・外部 DB なし）。

> **免責**: 表示されるシグナルは過去データに基づく参考情報です。投資判断はご自身の責任で行ってください。

## 主な機能

| 画面 | パス | 内容 |
|------|------|------|
| ダッシュボード | `/` | NASDAQ-100 全銘柄の短期シグナル（5/25日線 GC・価格×25日線）・長期トレンド（200日線）・パーフェクトオーダー・出来高判定・25日線乖離・BB±2σ・逆行高・ファンダ合格数・銘柄タイプ・VIX。セクター/シグナル絞り込み、20日騰落（相対強度）ソート |
| 銘柄詳細 | `/stocks/[ticker]` | 価格チャート（SMA5/25/200 + BB±2σ）・出来高・RSI、テクニカル状態、ファンダ 6 カテゴリ判定と警戒フラグ、決算サプライズ（EPS 予想 vs 実績 4 四半期）、手動メモ（国別売上・事業構成） |
| バックテスト | `/backtest` | ルール（5/25 GC・価格×25日線・RSI）に従って過去に売買していた場合の成績を Buy & Hold と比較 |

判定ルールの詳細（閾値・意図）は [docs/design-decisions.md](./docs/design-decisions.md) を参照。

## 技術スタック

| カテゴリ | 選定 |
|---------|------|
| フレームワーク | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS v4 / Recharts |
| DB | Prisma 7 + SQLite（ローカルファイル） |
| データ取得 | yahoo-finance2（非公式 API・キー不要・無料） |
| テスト | Vitest（単体）+ Playwright（E2E、chromium のみ） |

選定理由は [docs/design-decisions.md](./docs/design-decisions.md) を参照。

## セットアップ

必要環境: **Node.js 22 以上**（`.nvmrc` あり）

```bash
npm install            # postinstall で prisma generate も実行される
npx prisma migrate dev # SQLite の DB（prisma/dev.db）を作成
npm run dev            # http://localhost:3000
```

初回はダッシュボードの「データ更新」ボタンを押すと、全 101 銘柄 × 過去 5 年分の日足を取得します（数分かかります）。2 回目以降は差分のみ取得するのですぐ終わります。

## テスト

```bash
npm test          # 単体テスト（Vitest）
npm run test:e2e  # E2E（テスト用 DB にシード → Playwright 実行）
```

- E2E は実 API に依存しません（`scripts/seed-e2e.ts` の人工データを `prisma/test.db` に投入して実行）
- **WSL での注意**: `npx playwright install --with-deps` は sudo が必要で失敗します。ブラウザは `npx playwright install chromium` だけで入れ、足りないシステムライブラリは `sudo apt-get install` で個別に入れてください（詳細は [docs/maintenance.md](./docs/maintenance.md)）

## プロジェクト構成

```
app/                  # ページと API Route（Next.js App Router）
  api/sync/[ticker]/  #   1 銘柄分の差分同期（クライアントが直列に呼ぶ）
  api/backtest/       #   バックテスト実行
components/           # Client Component（テーブル・チャート・同期パネル）
lib/
  constants/          # NASDAQ-100 銘柄リスト（静的・手動更新）
  data/               # yahoo-finance2 への依存はここに隔離
  indicators/         # SMA・RSI（純粋関数）
  signals/            # シグナル判定（純粋関数）
  backtest/           # 売買シミュレーション（純粋関数）
  fundamentals/       # ファンダスコア算出（純粋関数）
  queries.ts          # ページ用のデータ組み立て（Server Component から呼ぶ）
prisma/               # スキーマ・マイグレーション・DB ファイル
scripts/seed-e2e.ts   # E2E 用の人工データ投入
docs/                 # 設計判断・運用手順
```

`lib/indicators` `lib/signals` `lib/backtest` `lib/fundamentals` は DB・API に依存しない純粋関数で、単体テスト（`__tests__/unit/`）が仕様書を兼ねます。

## ドキュメント

- [docs/design-decisions.md](./docs/design-decisions.md) — 設計判断の理由とシグナル仕様（なぜ SQLite か、なぜ調整後終値か、など）
- [docs/maintenance.md](./docs/maintenance.md) — 運用手順（銘柄リストの更新、DB リセット、yahoo-finance2 が壊れたときの対処）

## よくあるトラブル

| 症状 | 対処 |
|------|------|
| 同期で一部銘柄が失敗する | 画面の「失敗分を再実行」を押す（何度実行しても安全） |
| DB がおかしくなった | `rm prisma/dev.db*` → `npx prisma migrate dev` → データ更新 |
| データ取得が全銘柄失敗する | yahoo-finance2 の仕様変更の可能性。[docs/maintenance.md](./docs/maintenance.md) の復旧手順を参照 |
