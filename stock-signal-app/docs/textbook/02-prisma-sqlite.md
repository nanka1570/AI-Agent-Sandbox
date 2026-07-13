# 第2章 Prisma + SQLite

## 学習目標

- Prisma のスキーマ定義・マイグレーション・クライアント生成の流れを一人で回せる
- Supabase クライアント直呼びとの違い（何が楽になり、何が変わるか）を説明できる
- 複合主キー・リレーション・削除時の連鎖（onDelete）を設計できる

## facility-management との接続

facility-management では Supabase の JS クライアント（`supabase.from('facilities').select()...`）で DB を操作しました。Prisma は同じ「DB を操作する道具」ですが、アプローチが違います。

| | Supabase クライアント | Prisma |
|--|---------------------|--------|
| スキーマの正体 | Supabase ダッシュボードで作る（コードの外） | `schema.prisma` ファイル（コードの中・git 管理） |
| 型 | 手書きか生成ツールで別途用意 | スキーマから**自動生成**（`prisma generate`） |
| スキーマ変更の履歴 | 残らない（手作業） | **マイグレーションファイル**として自動で残る |
| DB の場所 | クラウド（Supabase） | 何でもよい。本アプリはローカルの SQLite ファイル |

stock-signal-app が SQLite を選んだ理由は設計判断として記録されています（`docs/design-decisions.md`）: 個人用ローカルツールに外部サービスを使うと「サービス側の都合で動かなくなる」リスクだけが増えるためです。実際、Supabase の無料プロジェクトが一時停止して開発がブロックされた経験がこの判断の背景にあります。

## 本編

### 1. セットアップの全体像

```bash
npm install prisma @prisma/client @prisma/adapter-better-sqlite3
# ① スキーマを書く      → prisma/schema.prisma
# ② 設定を書く          → prisma.config.ts（DB ファイルの場所）
# ③ マイグレーション実行 → npx prisma migrate dev --name init
#    （DB 作成 + 履歴保存 + クライアント生成が一度に走る）
```

**ハマりどころ（実話）**: `prisma`（CLI）と adapter だけ入れて `@prisma/client`（ランタイム本体）を入れ忘れると、開発中は動くのに `next build` で `Module not found: @prisma/client/runtime` と落ちます。3 点セットで覚えてください。

### 2. スキーマ定義 — stock-signal-app の 3 テーブル

`prisma/schema.prisma` は「テーブル定義書をコードで書いたもの」です。読み方:

```prisma
model DailyPrice {
  ticker   String
  date     DateTime // UTC 00:00 に正規化して保存
  close    Float
  adjClose Float    // 株式分割調整済み。計算はすべてこちらを使う
  volume   Float

  stock Stock @relation(fields: [ticker], references: [ticker], onDelete: Cascade)

  @@id([ticker, date])   // ← 複合主キー: 「銘柄×日付」で1行が一意
}
```

- `@@id([ticker, date])` — **複合主キー**。「NVDA の 2026-07-01 の行は 1 つしか存在できない」を DB に保証させる。facility-management の「同一施設・同一時間帯の二重予約防止」をアプリ側チェックでやったのを覚えていますか？ 主キー設計で防げるものは DB に任せるのが第一防衛線です
- `@relation(... onDelete: Cascade)` — 親（Stock）を消したら子（DailyPrice）も消える。facility では逆に RESTRICT（予約がある施設は消せない）を使いましたね。**消してよい関係なら Cascade、守りたい関係なら Restrict** と使い分けます
- 型に注意: `volume` を `BigInt` にしたくなりますが、BigInt は `JSON.stringify` できず Server→Client 受け渡しで事故ります（本アプリはレビューで Float に変更した実話あり）

### 3. マイグレーション — スキーマ変更の作法

```bash
npx prisma migrate dev --name extend-fundamental   # スキーマ変更を適用 + 履歴を保存
npx prisma generate                                # 型付きクライアントを再生成
```

`prisma/migrations/` に SQL が日付付きで残ります。これが「DB 構造の git 履歴」になり、別マシンでも `migrate deploy` 一発で同じ DB を再現できます。Supabase 時代に「ダッシュボードでポチポチした変更を思い出せない」問題があったなら、それの解決策です。

### 4. クライアントの使い方とシングルトン

生成されたクライアントは完全に型付きです。

```ts
const rows = await prisma.dailyPrice.findMany({
  where: { ticker: "NVDA" },
  orderBy: { date: "desc" },
  take: 300,
  select: { date: true, adjClose: true },   // ← 戻り値の型は { date: Date; adjClose: number }[]
});
await prisma.stock.upsert({ where: { ticker }, update: {...}, create: {...} }); // あれば更新・なければ作成
```

Next.js の開発サーバーはホットリロードのたびにモジュールを作り直すため、素朴に `new PrismaClient()` すると接続が増殖します。**globalThis にキャッシュするシングルトン**が定石です（見本: `lib/prisma.ts`。facility-management で Supabase クライアントを 1 箇所で作ったのと同じ発想）。

**ハマりどころ（実話）**: Prisma の `select` 結果を関数の戻り値にそのまま含めると、複雑な内部型のせいで受け取り側で `any` に化けることがあります。公開する関数には**明示的な戻り値型**（自分で定義した interface）を付けるのが安全です（見本: `lib/queries.ts` の `StockDetail`）。

### 5. テスト用 DB の分離（第7章の伏線）

SQLite はただのファイルなので、環境変数でファイルパスを切り替えるだけでテスト用 DB を分離できます。

```ts
const file = process.env.DATABASE_FILE ?? path.join("prisma", "dev.db");
```

本アプリでは E2E テストが `DATABASE_FILE=prisma/test.db` で走り、開発用データを汚しません。この「設定は環境変数で外から注入する」パターンは今後何度も出てきます。

## 見本の場所

- スキーマ: `prisma/schema.prisma`（3 モデル・コメント付き）
- 設定: `prisma.config.ts`（DB ファイルの場所と環境変数切替）
- シングルトン: `lib/prisma.ts`
- マイグレーション履歴: `prisma/migrations/`

## 演習

1. **[設計]** 見本を見ずに、株アプリの 3 テーブル（銘柄・日足・財務指標）のスキーマを紙に書く。「日足の主キーは何か」「銘柄が消えたら日足はどうするか」を自分で決めてから、`prisma/schema.prisma` と比較する
2. **[構築]** 空の Next.js プロジェクトに Prisma + SQLite を導入し、`Book { isbn, title, readAt }` のような好きなモデルで `migrate dev` → `prisma studio`（GUI で中身が見える）まで通す
3. **[実験]** 演習 2 のモデルに複合主キーを設定し、同じキーで 2 回 `create` してエラーを観察する。次に `upsert` に変えて動作の違いを確認する

## 理解度チェック

- [ ] `migrate dev` / `generate` / `migrate deploy` の役割の違いを言える
- [ ] 複合主キーで防げる不整合の例を facility-management の文脈で 1 つ挙げられる
- [ ] Cascade と Restrict の使い分けを説明できる
- [ ] なぜ PrismaClient をシングルトンにするのか説明できる
