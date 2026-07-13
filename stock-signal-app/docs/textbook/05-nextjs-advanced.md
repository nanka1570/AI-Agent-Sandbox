# 第5章 Next.js App Router 応用

## 学習目標

- Server Component / Client Component の境界を意図して設計できる
- サーバーからクライアントへ渡せるデータの制約（シリアライズ境界）を説明できる
- Route Handler（API）と Server Action の使い分けを説明・実装できる

## facility-management との接続

facility-management では、コンポーネントから Supabase クライアントを呼ぶ構成（多くはクライアントサイド fetch）だったはずです。App Router の本来の力は「**サーバーで完結する処理はサーバーで済ませ、クライアントには操作だけを残す**」ことにあります。この章では stock-signal-app の 3 パターンを通じてそれを学びます。

## 本編

### 1. Server Component が既定 — DB を「直接」読む

App Router では `"use client"` を書かない限り、コンポーネントはサーバーで実行されます。つまり**コンポーネントの中で await prisma が呼べる**:

```tsx
// app/page.tsx — Server Component。API を作らず DB を直読み
export default async function DashboardPage() {
  const summaries = await getStockSummaries();  // 中で prisma を使う
  return <DashboardTable summaries={summaries} />;
}
```

facility-management 式（クライアント → API or Supabase → 表示）と比べ、ローディング状態の管理・fetch のエラー処理・API ルートの作成が丸ごと不要になります。

`export const dynamic = "force-dynamic"` にも注目してください。Next.js はページを静的化しようとしますが、「同期ボタンを押したら最新の DB が見えてほしい」ページは毎回サーバーで描画する必要があります。**「このページはいつ再計算されるか」を意識する**のが App Router の要点です。

### 2. Client Component は「操作がある葉」だけ

`"use client"` が必要なのは useState・onClick・ブラウザ API を使う部分だけです。本アプリの構成:

```
app/page.tsx            … Server（DB 読み）
 ├─ SyncPanel           … Client（ボタン・進捗の state）
 └─ DashboardTable      … Client（フィルタ・ソートの state）
app/stocks/[ticker]/page.tsx … Server（DB 読み・指標計算）
 ├─ PriceChart          … Client（Recharts はブラウザでしか動かない）
 └─ MemoForm            … Client（textarea の state）
```

原則: **ページ = Server、対話部品 = Client**。Client を木の「葉」に押し込むほど、データ取得はサーバーに残せます。

### 3. シリアライズ境界 — Server から Client へ渡せる物

Server Component から Client Component への props は**ネットワークを越える**ため、JSON にできる値しか渡せません。本アプリで実際に踏んだ罠が 2 つあります:

- **Date** → 渡せるが扱いが面倒。本アプリは `date.toISOString().slice(0, 10)` で**文字列にしてから**渡す（`lib/queries.ts` の `SerializedSignal`）
- **BigInt** → `JSON.stringify` が例外を投げる。DB の volume 列を BigInt にしない判断（第2章）はこの境界のためでもある

「クエリ層で画面用の型（すべて string/number/boolean）に変換してから渡す」を習慣にすると、この境界で悩まなくなります。

### 4. Route Handler — 「クライアントから叩く API」が必要なとき

Server Component で済むなら API は不要です。それでも本アプリに `/api/sync/[ticker]` がある理由は、**クライアントのループから 117 回呼んで進捗を出す**必要があるから（第3章）。つまり Route Handler を作るのは「クライアント主導で何度も呼ぶ」「外部サービスから呼ばれる」など明確な理由があるときだけです。

```ts
// app/api/sync/[ticker]/route.ts — Next.js 16 の書き方
export async function POST(_req: Request, ctx: RouteContext<"/api/sync/[ticker]">) {
  const { ticker } = await ctx.params;   // ← params は await が必要（v15以降）
  try {
    return Response.json(await syncStock(ticker.toUpperCase()));
  } catch (error) {
    return Response.json({ error: ... }, { status: 500 });  // エラーも JSON で返す
  }
}
```

注意: フレームワークの世代でこの書き方は変わります（`RouteContext` 型・`await params` は Next.js 16）。**`node_modules/next/dist/docs/` に同梱の公式ドキュメントがある**ので、書く前にそこで現行の作法を確認する癖をつけてください。

### 5. Server Action — フォーム保存の最短経路

「メモを保存」のような単純な書き込みは、API を作らずに Server Action で書けます。

```ts
// actions.ts
"use server";
export async function saveMemo(ticker: string, memo: string): Promise<SaveMemoResult> {
  // ① 検証 ② DB 更新 ③ revalidatePath で画面のキャッシュを無効化
}
```

```tsx
// Client Component 側
const [pending, startTransition] = useTransition();
startTransition(async () => {
  const result = await saveMemo(ticker, memo);   // 関数呼び出しに見えるが実体は POST
});
```

**セキュリティの要点（レビューで指摘された実話）**: Server Action は「ただの関数」に見えますが、実体は**誰でも叩ける公開エンドポイント**です。だから ① 入力は必ず検証する（未知の ticker・メモ 4,000 字超を拒否）、② 例外を投げず `{ ok, error }` を返して画面で表示する。facility-management で「アプリ側チェックと DB 側制約の二重防御」をやったのと同じ精神です。

### 6. 使い分けの早見表

| やりたいこと | 使うもの | 本アプリの実例 |
|-------------|---------|--------------|
| ページ表示用のデータ取得 | Server Component + クエリ層 | `app/page.tsx` |
| フォームの保存・単発の書き込み | Server Action | `saveMemo` / `generateMemoDraft` |
| クライアントが繰り返し呼ぶ処理 | Route Handler | `/api/sync/[ticker]` |
| 表計算・チャート等の対話 UI | Client Component | `DashboardTable` / `PriceChart` |

## 見本の場所

- Server / Client 境界: `app/page.tsx` と `components/sync-panel.tsx` の分業
- シリアライズ: `lib/queries.ts` の `StockSummary`（すべて JSON 安全な型）
- Route Handler: `app/api/sync/[ticker]/route.ts` / `app/api/backtest/route.ts`（入力検証の実例）
- Server Action: `app/stocks/[ticker]/actions.ts`（検証 → 更新 → revalidatePath → 結果型）

## 演習

1. **[分類]** facility-management の画面を 1 つ選び、「Server にできる部分 / Client が必要な部分」に線を引く。Client が必要な理由（state? イベント?）を部位ごとに書く
2. **[Server Action]** facility-management の「プロフィール編集」相当を Server Action で書き直す設計をする: 検証ルール・戻り値の型・revalidatePath の対象を決める
3. **[実験]** 適当な Server Component から Client Component に `new Date()` と `{ big: 10n }`（BigInt）を props で渡してみて、それぞれ何が起きるか観察する
4. **[判断]** 「バックテスト実行」は本アプリでは Route Handler だが、Server Action でも書ける。どちらでも成立する理由と、あなたならどちらを選ぶかを理由付きで書く

## 理解度チェック

- [ ] 「ページ = Server、対話部品 = Client」の原則と、その利点を説明できる
- [ ] Server → Client の props に渡せない/渡しにくい型を 2 つ挙げ、対処を言える
- [ ] Route Handler を作る判断基準を言える（作らなくて済む場合との違い）
- [ ] Server Action で入力検証が必須な理由を説明できる
