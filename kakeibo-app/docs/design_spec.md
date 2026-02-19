# 家計簿アプリ UIデザイン仕様書 (Ver.2: Retro Pop Edition)

「ありきたりなデザイン」からの脱却を目指し、**Neo-Brutalism (ネオ・ブルータリズム)** と **Retro Pop (レトロポップ)** を融合させた、ユニークで視認性の高いデザインを採用します。

## コンセプト: "Bold & Playful" (大胆かつ遊び心)

*   **脱・繊細**: 細い線や淡い影は使わず、太い黒枠 (`border-2` or `border-4`) とハードシャドウ (`box-shadow: 4px 4px 0px black`) を多用します。
*   **高コントラスト**: パキッとした原色に近いカラーを使い、視認性を確保しつつ「道具」としての楽しさを演出します。
*   **幾何学的**: 角丸は小さめ、または完全な四角形を組み合わせ、コミックのようなメリハリをつけます。
*   **言語**: ヘッダーのナビゲーションリンク（DASHBOARD, CARDS, PAYMENTS）は**英語**表記とします。それ以外（ラベル、金額など）は日本語を使用します。

---

## 1. 配色 (Vibrant Palette)

全体的に彩度が高く、黒い枠線で引き締めるスタイルです。

### CSS変数 (HSL - Tailwind v4互換)

`src/app/globals.css` 用の更新コードです。

```css
@layer base {
  :root {
    --radius: 0.5rem; /* 8px - 少し角張らせる */

    /* Base: Off-White & Pitch Black */
    --background: hsl(45 30% 96%);  /* Warm Cream / Antique White */
    --foreground: hsl(0 0% 10%);    /* Soft Black */

    /* Surface: Pure White for cards with black borders */
    --card: hsl(0 0% 100%);
    --card-foreground: hsl(0 0% 10%);
 
    --popover: hsl(0 0% 100%);
    --popover-foreground: hsl(0 0% 10%);
 
    /* Primary: Electric Violet */
    --primary: hsl(265 89% 66%);
    --primary-foreground: hsl(0 0% 100%);
 
    /* Secondary: Lemon Yellow (Attention) */
    --secondary: hsl(50 100% 65%);
    --secondary-foreground: hsl(0 0% 10%);
 
    /* Muted: Light Gray for inactive areas */
    --muted: hsl(210 20% 90%);
    --muted-foreground: hsl(215 20% 40%);
 
    /* Accent: Mint Green (Interactive) */
    --accent: hsl(150 90% 40%);
    --accent-foreground: hsl(0 0% 100%);
 
    /* Destructive: Hot Pink / Red */
    --destructive: hsl(340 90% 60%);
    --destructive-foreground: hsl(0 0% 100%);

    /* Borders are ALWAYS Black */
    --border: hsl(0 0% 10%);
    --input: hsl(0 0% 100%);
    --ring: hsl(0 0% 10%);

    /* Chart Colors (Comic Style) */
    --chart-1: hsl(265 89% 66%); /* Violet */
    --chart-2: hsl(188 90% 45%); /* Cyan */
    --chart-3: hsl(340 90% 60%); /* Pink */
    --chart-4: hsl(50 100% 65%); /* Yellow */
    --chart-5: hsl(150 90% 40%); /* Mint */

    --sidebar: hsl(45 30% 96%);
    /* ...sidebar variants match main theme... */
    --sidebar-foreground: hsl(0 0% 10%);
    --sidebar-primary: hsl(265 89% 66%);
    --sidebar-primary-foreground: hsl(0 0% 100%);
    --sidebar-accent: hsl(50 100% 65%);
    --sidebar-accent-foreground: hsl(0 0% 10%);
    --sidebar-border: hsl(0 0% 10%);
    --sidebar-ring: hsl(0 0% 10%);
  }
}
```

## 2. デザインルール (The "Neo-Brutal" Rules)

### 共通スタイル (Common Styles)

すべての主要なコンポーネント（カード、ボタン、入力欄）に以下のクラスを適用します。

*   **枠線**: `border-2 border-black`
*   **影**: `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` (ハードシャドウ)
    *   ボタン押下時: `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`

### サマリーカード (Dashboard)

ただの白い四角ではなく、ステータスに応じた背景色も活用します。

1.  **収入**: 背景 `bg-emerald-100` + ボーダー黒 + シャドウ黒。
2.  **支出**: 背景 `bg-rose-100` + ボーダー黒 + シャドウ黒。
3.  **残高**: 背景 `bg-white` (または `bg-yellow-300` で強調) + 極太フォント。

### フォント & タイポグラフィ

*   **英語数字**: 可能であればGoogle Fontsの `Space Grotesk` や `Chivo Mono` などの等幅・幾何学系フォントを導入推奨。
*   **日本語**: `Noto Sans JP` の **Bold (700)** を多用し、力強い印象に。

## 3. コンポーネント詳細

### ステータスバッジ (Pill -> Tag)
丸いバッジではなく、長方形に近いタグ風デザインにします。

*   **未確定**: 白背景 + 黒枠 + 点線 (`border-dashed`)
*   **確定**: 黄色背景 (`bg-yellow-300`) + 黒文字 + 黒枠
*   **支払い済み**: 黒背景 (`bg-black`) + 白文字 + 黒枠

### グラフ (Charts)
Rechartsのスタイルも変更します。

*   **棒グラフ**: 角丸なし (`radius: 0`)。バーの縁取りに `stroke="black" strokeWidth={2}` を追加。
*   **円グラフ**: 各セグメントに `stroke="black" strokeWidth={2}` を追加し、コミックのような見た目に。

## 4. モックアップ確認方法

`docs/design/mockup.html` をブラウザで開いて確認してください。
Tailwindのクラスを駆使して、この「枠線＋ハードシャドウ」の世界観を再現します。


