# 環境デザイン: タイルセット & 背景

## ビジュアルコンセプト
- **スタイル**: "ソフトポップ・ベクトル" (Soft Pop Vector)
- **キャラクターとの関係**: 
  - キャラクターは **太い茶色のアウトライン** を持つ。
  - 環境は、キャラを目立たせるために **細い/色付きのアウトライン** または **アウトラインなし** にする。
- **解像度**: 32x32px タイル。
- **パレット**: キャラクターと比較して少し彩度を落とす（視覚的なノイズを防ぐため）。

## タイル数と仕様 (ステージごと)
各ステージは、以下の要素を含む 512x512px (程度の) タイルセット画像を1枚必要とする:

| カテゴリ | タイル名 | 数 (概算) | 備考 |
|---|---|---|---|
| **Ground** | 上 / 中 / 下 | 9枚 | 3x3 オートタイル用 |
| **Ground** | 坂 / 角 | 4-6枚 | 変化のある地形用 |
| **Platform** | 浮遊島 | 3枚 | 左、中、右 |
| **Wall** | 垂直の壁 | 3枚 | 上、中、下 |
| **Hazards** | トゲ / 溶岩 | 1-3枚 | |
| **Decor** | 大道具 | 2-4個 | 木、像 (マルチタイル) |
| **Decor** | 小道具 | 4-8枚 | 花、岩、草 |

---

## 1. 森の入口 (Forest of Beginnings)
- **テーマ**: 明るい、チュートリアル、自然。
- **カラーキー**: 新緑 (#7CC74C), 空色 (#68C2D3), 土色 (#8B5E3C)。

### アセット詳細
- **地面**: 上部は明るい緑の丸みのある草。下部は土のパターン。
- **足場**: 空中に浮いている地面の断片。
- **装飾**:
  - **木**: 丸い広葉樹 (2x3タイル)。
  - **茂み**: 丸くてシンプルな茂み (1x1)。
  - **看板**: 木製の矢印看板。
  - **花**: 白や黄色の小さな花。

### カラーラフ用プロンプト
```text
2D game 32x32px tileset concept art, fantasy forest level, bright green grass ground tiles, brown dirt pattern, floating grassy platforms, round trees, wooden signpost, cute vector illustration style, flat shading, white background, grid arrangement
```

---

## 2. 古城 (Ancient Castle)
- **テーマ**: 石、歴史、クール。
- **カラーキー**: クールグレー (#7A8490), 紫 (#663399), 橙色の松明 (#FF8C00)。

### アセット詳細
- **地面**: グレーの石レンガ。少し苔むしている。
- **足場**: 崩れた石の橋。
- **装飾**:
  - **旗**: 金の装飾が重厚な紫の壁掛けバナー。
  - **松明**: 壁掛けの鉄製松明。
  - **木箱**: 木製の補給物資箱。
  - **鎖**: ぶら下がっている鉄の鎖。
- **危険物**: 銀色の鉄のトゲ。

### カラーラフ用プロンプト
```text
2D game 32x32px tileset concept art, fantasy castle dungeon level, grey stone brick tiles, purple royal banners, wall torches, iron spikes, wooden crates, cute vector illustration style, flat shading, white background, grid arrangement
```

---

## 3. 魔王の塔 (Demon Tower)
- **テーマ**: 危険、魔法、最終ステージ。
- **カラーキー**: ダークネイビー (#1A1A2E), 深紅 (#C62828), 輝くシアン。

### アセット詳細
- **地面**: 紫がかった黒曜石のレンガ。
- **足場**: 幾何学的な浮遊する魔法石。
- **装飾**:
  - **文字**: 壁に光るルーン文字。
  - **像**: ガーゴイルまたは悪魔の像 (2x2)。
  - **クリスタル**: 不吉な赤いクリスタルの塊。
- **危険物**: 泡立つ赤い溶岩の表面 (液体タイル)。

### カラーラフ用プロンプト
```text
2D game 32x32px tileset concept art, evil demon tower level, dark navy brick tiles, glowing red lava, magic runestones, gargoyle statue, red crystals, cute vector illustration style, flat shading, white background, grid arrangement
```

---

# 背景デザイン (パララックスレイヤー)

## 共通仕様
- **解像度**: 640x360px (1280x720にスケール)。
- **スタイル**: 太いアウトラインなしのベクターアート。遠景レイヤーにはソフトフォーカス効果。

## 1. 森の入口
- **時間**: 昼 (正午)。
- **雰囲気**: 明るい、開放的、平和。

### パララックスレイヤー構成
1.  **空 (固定)**: グラデーションの青空 ＋ ふわふわした白い雲。
2.  **遠景の山 (遅い)**: 淡い緑/青の山のシルエット。
3.  **中景の森 (中)**: 柔らかい丸い木々 (薄緑のレイヤー)。
4.  **近景の茂み (速い)**: *任意* 手前を通り過ぎるボケた茂み。

### プロンプト
```text
2D game background art, fantasy forest, bright day, blue sky with fluffy clouds, distant green mountains, lush forest trees, anime background style, vector art, soft colors, wide angle, 640x360 resolution
```

## 2. 古城
- **時間**: 夜 (満月)。
- **雰囲気**: クール、ミステリアス、少しゴシックだが可愛い。

### パララックスレイヤー構成
1.  **空 (固定)**: 濃い青の夜空 ＋ 巨大な黄色い満月。
2.  **遠景の壁 (遅い)**: 大きなアーチ窓のあるダークグレーの石壁。
3.  **中景の柱 (中)**: 通り過ぎる石柱。奥の壁より少し明るい色。
4.  **近景の装飾 (速い)**: *任意* ぶら下がっているバナーや鎖。

### プロンプト
```text
2D game background art, fantasy castle interior, night time, full moon visible through window, stone walls, gothic pillars, dark blue and purple tones, anime background style, vector art, soft colors, wide angle, 640x360 resolution
```

## 3. 魔王の塔
- **時間**: 永遠の夜 / マジックアワー。
- **雰囲気**: 危険、魔力的、強烈。

### パララックスレイヤー構成
1.  **虚空 (固定)**: 渦巻く星雲のある暗い紫/黒の虚空。
2.  **遠景の魔法 (遅い)**: 回転する巨大な魔法陣 (赤/シアン)。
3.  **中景の構造物 (中)**: ねじれた暗黒の塔の建築、浮遊する岩。
4.  **近景の粒子 (速い)**: 上昇する魔法の残り火。

### プロンプト
```text
2D game background art, evil demon tower, dark void dimension, swirling red magic energy, floating rocks, twisted architecture, anime background style, vector art, intense colors, wide angle, 640x360 resolution
```
