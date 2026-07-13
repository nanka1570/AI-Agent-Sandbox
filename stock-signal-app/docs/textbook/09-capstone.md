# 第9章 総合演習 — ミニ株シグナルアプリをゼロから作る

ここまでの全章を使って、stock-signal-app の**縮小版**を自分の手で作ります。縮小版と言っても、アーキテクチャは本物と同じです。完走すれば「同じものを作れる」と言ってよい状態になります。

## 完成条件（ミニ版のスコープ）

本物との差分を先に決めておきます。**足すのは簡単、最初から欲張ると完成しない**ためです。

| 項目 | ミニ版 | 本物 |
|------|-------|------|
| 銘柄数 | 5 銘柄（好きなもの） | 117 銘柄 |
| テクニカル | SMA 5/25 クロスのみ | + RSI・BB・出来高・乖離・逆行高 |
| ファンダ | なし | 6 カテゴリ判定 |
| 画面 | 一覧・詳細・バックテストの 3 つ | 同じ 3 つ（列が多い） |
| AI | なし（拡張課題） | メモ下書き生成 |
| テスト | 単体 15 件以上 + E2E 1 件 | 単体 70 件 + E2E 3 件 |

## 進め方のルール（facility-management と同じ）

- 各工程の「完了条件」を満たしてから次へ進む
- 詰まったら、参照先のファイルを**読んで理解し、閉じてから**自分のコードを書く。コピーしない
- 工程ごとに git commit（メッセージは feat/fix/test/docs 規約で）

---

## 工程 1: 雛形と DB（第2章）

**やること**
- create-next-app（TypeScript / Tailwind / App Router）
- Prisma + SQLite を導入し、`Stock` と `DailyPrice`（複合主キー）の 2 モデルを定義
- 5 銘柄の定数ファイル `lib/constants/stocks.ts` を作る

**完了条件**
- [ ] `npx prisma migrate dev` が通り、`npx prisma studio` で 2 テーブルが見える
- [ ] `lib/prisma.ts` のシングルトンがある
- [ ] `npx tsc --noEmit` がエラーなし

**詰まったら**: `prisma/schema.prisma`, `lib/prisma.ts`, `prisma.config.ts`

## 工程 2: データ取得と差分同期（第3章）

**やること**
- yahoo-finance2 を導入し、`lib/data/yahoo.ts`（API 依存はここだけ）と `lib/data/transform.ts`（変換の純粋関数）を作る
- `lib/data/sync.ts` に差分同期を実装（初回 1 年分で十分。最新日を含めて取り直す方式）
- `POST /api/sync/[ticker]` の Route Handler

**完了条件**
- [ ] `curl -X POST localhost:3000/api/sync/AAPL` で `{"ticker":"AAPL","added":250}` 程度が返る
- [ ] もう一度実行すると added が 1 前後（差分だけ）になり、行が重複しない
- [ ] transform の単体テストが 3 件以上ある

**詰まったら**: `lib/data/sync.ts`（罠の解説コメント付き）, `__tests__/unit/transform.test.ts`

## 工程 3: 指標とシグナル + テスト（第4章）

**やること**
- `lib/indicators/sma.ts` を**テストファースト**で実装
- `lib/signals/evaluate.ts` に SMA クロス判定（期間は引数化、デフォルト 5/25）
- 「直近 N 営業日以内のシグナルを現在シグナルとする」`recentSignal()`

**完了条件**
- [ ] 単体テスト 10 件以上・全部グリーン（既知値・境界値・「上昇し続けたら」等の性質）
- [ ] テスト名だけ読めば仕様がわかる状態になっている

**詰まったら**: `lib/indicators/sma.ts`, `lib/signals/evaluate.ts`, `__tests__/unit/evaluate.test.ts`

## 工程 4: 一覧画面（第5章）

**やること**
- `lib/queries.ts` に「全銘柄のサマリ（最新終値・現在シグナル）」を組み立てる関数（DB → 純粋関数 → 画面用の型。Date は文字列化）
- `app/page.tsx`（Server Component）+ 同期ボタン `SyncPanel`（Client、5 銘柄を直列 fetch して進捗表示）

**完了条件**
- [ ] 同期ボタン → 進捗が 1/5…5/5 と進む → 一覧に 5 銘柄と終値・シグナルバッジが出る
- [ ] `export const dynamic = "force-dynamic"` の必要性を自分の言葉で説明できる

**詰まったら**: `lib/queries.ts`, `app/page.tsx`, `components/sync-panel.tsx`

## 工程 5: 詳細ページとチャート（第6章）

**やること**
- `app/stocks/[ticker]/page.tsx`（Server）で価格 + SMA5/25 の chartData を組み立て
- `components/price-chart.tsx`（Client）で Recharts 描画（`isAnimationActive={false}` を忘れずに）
- ダークモード両対応（`dark:` 変種 + チャートは currentColor）

**完了条件**
- [ ] `/stocks/AAPL` で 3 本線のチャートが描ける（SMA25 の先頭が欠けて見えるのが正しい）
- [ ] DevTools で dark に切り替えても全要素が読める

**詰まったら**: `app/stocks/[ticker]/page.tsx`, `components/price-chart.tsx`

## 工程 6: バックテスト（第4・5章）

**やること**
- `lib/backtest/run.ts`: シグナルに従い全額買い/全額売り。総リターン・勝率・Buy&Hold 比較を返す純粋関数
- 仕様の穴（保有中の買い・期末に保有中・ウォームアップ）を**自分で決めて**コメントに書く
- `/backtest` ページ（銘柄と期間を選んで実行。Route Handler でも Server Action でも可——選んだ理由を書くこと）

**完了条件**
- [ ] 人工データのテスト 5 件（「単調上昇を初日買いで +○%」等）がグリーン
- [ ] 実データで実行し、結果の数字を Buy&Hold と見比べて妥当性を目視確認した

**詰まったら**: `lib/backtest/run.ts`, `__tests__/unit/backtest.test.ts`, `app/api/backtest/route.ts`

## 工程 7: E2E と仕上げ（第7章）

**やること**
- シードスクリプト（下降→上昇でクロスが必ず出る人工系列）+ `DATABASE_FILE` でテスト DB 分離
- E2E 1 件: 一覧 → 詳細 → チャート見出しの表示確認
- README を書く（セットアップ 3 行・使い方・構成図）。**未来の自分が読者**

**完了条件**
- [ ] `npm run test:e2e` が外部 API に一切アクセスせずグリーン
- [ ] `tsc / lint / vitest / build / e2e` の 5 点セットが全部通る
- [ ] README だけ見て、クリーンな環境でセットアップできる自信がある

**詰まったら**: `playwright.config.ts`, `scripts/seed-e2e.ts`, `__tests__/e2e/app.spec.ts`

---

## 拡張課題（完走後に、好きな順で）

1. **RSI を追加**（第4章の復習）: 指標 → シグナル → 一覧の列 → バックテストのルール選択、と縦に一気通貫で足す。「機能追加が層をどう貫くか」を体感する
2. **ファンダ 1 カテゴリ**: yahoo-finance2 の `quoteSummary` で PER を取り、「15 倍以下」判定を表示（TTL キャッシュ付き・第3章）
3. **AI メモ下書き**（第8章）: EDGAR から 10-K を取り抜粋 → Claude で抽出 → メモ欄に下書き。キー未設定フォールバック込み
4. **自分の判断基準を実装する**: 本アプリが「ユーザーの投資判断基準」をルール化したように、あなた自身の基準（あるいは facility-management のドメイン知識）を定数と純粋関数に翻訳してみる

## 完走後の自己評価

以下に全部 YES なら、この教科書は卒業です。

- [ ] 各層（constants / data / 純粋関数 / queries / app）の役割を、自分のコードを指しながら説明できる
- [ ] 「テストがあるから安心してリファクタできる」を 1 回以上体験した
- [ ] 外部 API が落ちても画面が生きている理由を説明できる
- [ ] 本物の stock-signal-app のコードを読んで、「なぜこうなっているか」が推測できる

最後に: 本物との差分（RSI・BB・出来高・ファンダ 6 カテゴリ・タイプ分類・AI）は、すべて「この教科書でやったことの繰り返し」です。設計判断に迷ったら `docs/design-decisions.md` に本物の判断理由が全部書いてあります。
