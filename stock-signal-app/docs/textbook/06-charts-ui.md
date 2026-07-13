# 第6章 チャートと UI 作法（Recharts・ダークモード・共通化）

## 学習目標

- Recharts で複数系列の折れ線チャート・棒グラフを描ける
- 「チャート用データの整形」をクエリ層/ページ側で行う設計を理解する
- ダークモード対応・スタイル共通化の実務的な作法を身につける

## facility-management との接続

facility-management の UI は表とフォームでした。チャートは「大量の数値を 1 枚の絵にする」部品で、データの**整形**（ライブラリが食べられる形に変換する）が仕事の 8 割です。Tailwind は既知の前提で、ダークモード対応と共通化という「規模が出たときの作法」を足します。

## 本編

### 1. Recharts の基本形 — データは「1 行 = 1 点」

Recharts は `{ x軸の値, 系列A, 系列B, ... }` の配列を受け取ります。**null はギャップとして描画される**ので、SMA200 のように「最初の 199 日は値がない」系列も同じ配列に混ぜられます。

```tsx
const chartData = bars.map((b, i) => ({
  date: b.date.toISOString().slice(0, 10),  // X 軸（文字列で OK）
  adjClose: b.adjClose,
  sma25: sma25[i],        // null なら線が途切れる（それが正しい）
}));

<ResponsiveContainer width="100%" height={320}>
  <LineChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" minTickGap={60} />
    <YAxis domain={["auto", "auto"]} />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="adjClose" name="調整後終値" stroke="#3b82f6" dot={false} />
    <Line type="monotone" dataKey="sma25" name="SMA25" stroke="#f59e0b" dot={false} />
  </LineChart>
</ResponsiveContainer>
```

要点:
- `ResponsiveContainer` で親幅に追従（height は固定値が必要）
- `dot={false}` — 1,250 点に丸を打つと重くて見えない
- 出来高のような棒は `<BarChart>` + `<Bar>`。価格と出来高は**スケールが違いすぎる**ので別チャートに分ける（本アプリは 3 段構成: 価格・出来高・RSI）
- Recharts は Client Component 必須（`"use client"`）

### 2. パフォーマンスの実話 — ツールチップのラグ

本アプリで「カーソルを合わせてから表示まで遅い」という報告がありました。原因は Recharts の**既定アニメーション**（ツールチップの追従イージング約 400ms + 線の描画アニメーション）で、データが多いほど体感が悪化します。

```tsx
<Tooltip isAnimationActive={false} />
<Line ... isAnimationActive={false} />
```

これだけで表示は実測 7ms になりました。教訓は 2 つ:
- ライブラリの「見栄えの既定値」は、データ量が増えると性能問題に化ける
- 「遅い」と感じたら**測る**（このときは Playwright で mousemove からツールチップ可視までを計測して before/after を確認した）

### 3. チャート用整形はどこでやるか

第1章の層で言うと、チャート整形は「画面の都合」なので**ページ（Server Component）側**でやります。純粋関数（sma 等）を呼んで配列を作り、数値を丸め、Client のチャート部品には**完成品の配列だけ**を渡す。チャート部品は「描くだけ」に保つと再利用できます（見本: `PriceChart` は `ChartPoint[]` を受け取るだけで、計算を一切知らない）。

### 4. ダークモード対応の作法

本アプリで実際に起きた事故: create-next-app の雛形 CSS に「ブラウザがダークモードなら文字をほぼ白にする」既定が残っており、**白いカードに白文字**で読めなくなりました。学ぶべき教訓ごと整理します。

1. **方針を先に決める**: 追従する（light/dark 両対応）か、固定するか。両対応なら `color-scheme: light dark` を宣言し、**すべての色指定に `dark:` 変種をセットで書く**
   ```tsx
   className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100"
   ```
2. **付け忘れが事故になる**: 背景だけ dark 対応して文字を忘れると「黒背景に黒文字」になる。「新しい UI を追加するときは dark: を必ずセットで」のようなルールを docs に残す（本アプリは design-decisions.md に記録）
3. **SVG チャートは Tailwind が効かない**: Recharts の軸・グリッドは SVG 属性なので `dark:` が使えない。解法は `stroke="currentColor"` / `fill="currentColor"` にして、**外側の div の文字色**（これは Tailwind で切替可能）を継承させるテクニック
   ```tsx
   <ResponsiveContainer className="text-gray-500 dark:text-gray-400" ...>
     <CartesianGrid stroke="currentColor" strokeOpacity={0.25} />
     <XAxis tick={{ fontSize: 11, fill: "currentColor" }} />
   ```

### 5. スタイルの共通化 — 重複が事故を生む前に

「買い=緑 / 売り=赤 / 警戒=オレンジ」のバッジを素朴に書くと、同じ長い className が 10 箇所にコピーされます。実際に本アプリはそうなり、コードレビューで共通化しました。

```tsx
// components/badge.tsx — 配色はこのファイルだけが知っている
const TONES = {
  green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  red:   "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  ...
};
export function Badge({ tone, title, children }: {...}) { ... }
```

判断基準: **「同じ見た目のもの」が 3 箇所以上に現れたら部品化**。ダークモード対応のような全体変更のとき、共通化してあれば 1 ファイル、してなければ 10 箇所の修正になります（第1章の「定数一元管理」の UI 版です）。

## 見本の場所

- チャート 3 段構成: `components/price-chart.tsx`（アニメーション無効化・currentColor 込み）
- 整形はページ側: `app/stocks/[ticker]/page.tsx` の `chartData` 組み立て
- バッジ共通化: `components/badge.tsx` と、それを使う `components/dashboard-table.tsx`
- ダークモード方針: `app/globals.css` + `docs/design-decisions.md` の該当節

## 演習

1. **[チャート]** 第3章の演習で貯めた天気データ（または適当な CSV）で「最高気温 + その 3 日移動平均」の 2 系列チャートを描く。移動平均は第4章で自作した `sma()` を使うこと
2. **[ダーク]** 演習 1 のページをダークモード両対応にする。ブラウザの DevTools（Rendering → prefers-color-scheme）で light/dark を切り替えて、読めない配色がないか確認する
3. **[共通化]** facility-management の予約ステータス表示（予約済み/キャンセル等）を Badge 部品として設計する。tone は何種類必要か、title（ホバー説明）に何を出すかを決める
4. **[計測]** 演習 1 のチャートのデータを 10,000 点に増やし、ツールチップの体感を確認。`isAnimationActive={false}` の有無で違いを体験する

## 理解度チェック

- [ ] Recharts のデータ形式（1 行 1 点、null はギャップ）を説明できる
- [ ] チャートの整形をページ側で行い、チャート部品を「描くだけ」に保つ理由を言える
- [ ] SVG チャートをダークモード対応させる currentColor テクニックを説明できる
- [ ] 「3 箇所ルール」で部品化・定数化を判断できる
