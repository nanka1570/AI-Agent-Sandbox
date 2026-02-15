# キャラクターデザイン: プレイヤー (再設計版)

## コンセプト
- **役割**: 魔法剣士 (剣と魔法)
- **スタイル**: 美少女マスコット (パターン A-5: 2.2頭身)
- **テーマ**: "Cute but Cool" (可愛くてカッコいい)

## ビジュアルデザイン
- **シルエット**:
  - **頭部**: 大きく表情豊か。ピンクのボブヘアに太めのハイライト。
  - **体**: **巨大な青いフード/マント** により、小さくてもはっきりとしたAラインのシルエットを作る。
  - **手足**: 短いが棒人間ではない。丸みのある手足（ブーツ形状）。
- **衣装**:
  - **頭装備**: 巨大なロイヤルブルーのフード（先端が尖っており、三角形の形状を作る）。
  - **服**: クリーム色のチュニック ＋ 茶色の革ベルト。
  - **足**: 白タイツ（または生足） ＋ 茶色の丸いブーツ。
- **武器**:
  - **剣**: 短く太い鉄の剣。柄は金。
- **カラーパレット**:
  - 青 (`#4169E1`), ピンク (`#FFB7C5`), 琥珀色 (`#FFBF00`), クリーム (`#FFFDD0`), 茶 (`#8B4513`)。

## スプライトポーズ (主要8ポーズ)
ターゲット解像度: 32x32px (元絵は大きくても可)

### 1. Idle (待機)
- **プロンプト**: `standing pose, breathing, facing right, holding sword down, cute smile, oversized hood`
- **見た目**: 基本の立ち姿。膝を軽く曲げる。マントは自然に垂れる。剣は右手で下げて持つ。

### 2. Running (走行)
- **プロンプト**: `running pose, dynamic action, leaning forward, cape fluttering horizontally behind, dust effect, holding sword ready`
- **見た目**: 45度前傾姿勢。腕を振る。マントが真後ろになびく（スピード線）。足は大股で `^` の形。

### 3. Jumping (ジャンプ - 上昇)
- **プロンプト**: `jumping pose, rising up, looking up, cape draped down, knees tucked, sword raised`
- **見た目**: 上に伸び上がる。重力でマントは下に下がる。片膝を高く上げる（マリオジャンプ風）。

### 4. Falling (落下 - 下降)
- **プロンプト**: `falling pose, dropping down, cape fluttering upwards like parachute, skirt billowing, looking down`
- **見た目**: 体を少しかがめる。マントが上に広がり、パラシュートのような形になる。髪が浮き上がる。

### 5. Attacking (攻撃)
- **プロンプト**: `attacking pose, swinging sword, dynamic slash, oversized motion effect, aggressive face`
- **見た目**: 大きな横薙ぎ。体が回転するようなフォロースルー。剣の軌跡エフェクト（白/青の円弧）。

### 6. Dashing (ダッシュ - 前方移動)
- **プロンプト**: `dashing pose, sliding forward, speed lines, afterimage effect, low posture, blue glow`
- **見た目**: 走りより低い姿勢。「滑る」または「ジェット」のような動き。背後に青い魔法の軌跡。剣はランスのように前に構える。

### 7. Wall Slide (壁滑り)
- **プロンプト**: `wall sliding pose, clinging to wall, facing left, friction sparks, sliding down vertical surface`
- **見た目**: 壁にしがみつく（壁と逆を見る）。剣を壁に突き立てるか、手でブレーキをかける。摩擦の砂埃。

### 8. Hit (被ダメージ)
- **プロンプト**: `taking damage pose, knocked back, pain expression >_< eyes, flash effect, losing balance`
- **見た目**: 後ろにのけぞる。手足がばたつく。目は `>_<`。マントが乱れる。

## 参照プロンプト (共通)
```text
2D game character sprite, fantasy adventurer, 2 heads tall, super deformed chibi anime girl, large detailed sparkling amber eyes, pink hair, massive oversized blue hood, cream tunic, holding a short thick sword, vector illustration style, clean bold dark-brown outlines, white background
```

---

# キャラクターデザイン: 敵 (再設計版)

## 共通スタイルルール
- **スタイル**: ソフトポップ・ベクトル (プレイヤーの線画・塗り品質に合わせる)
- **差別化**: 敵は **シンプルな点目** (または簡略化された顔) を採用し、「美少女」であるプレイヤーと区別して「モブ敵」であることを強調する。

## 1. Slime (スライム)
- **役割**: ステージ1 地上敵 (巡回)
- **サイズ**: 小 (約 24x20px)。プレイヤーの身長の半分程度。

### ビジュアルデザイン
- **シルエット**: 肉まん型 (Manju shape)。底が少し平ら。
- **特徴**:
  - **目**: シンプルな縦長の点 `•  •`。
  - **口**: 小さな `ω` の口。
  - **色**: 半透明の緑 (`#A4DD98`)、中心に濃い緑の核。
  - **線画**: 焦げ茶 (`#4A3B32`)。

### スプライトポーズ
1.  **Idle**: むにゅむにゅ動く (呼吸)。
2.  **Move**: 小さく跳ねながらスライド移動。
3.  **Hit**: パンケーキのように潰れる。目は `> <`。

### プロンプト
```text
2D game character sprite, fantasy slime monster, cute mascot, round bun shape, simple dot eyes, translucent green body, vector illustration style, clean bold dark-brown outlines, white background
```

## 2. Bat (コウモリ)
- **役割**: ステージ2 空中敵 (ホバリング & 急降下)
- **サイズ**: 中 (約 32x24px)。翼の幅が広い。

### ビジュアルデザイン
- **シルエット**: 丸いボール状の胴体に、大きなスカラップ状の翼。
- **特徴**:
  - **目**: 丸い点 `●  ●`。
  - **牙**: 小さな牙が一本出ている。
  - **色**: 紫 (`#9370DB`) の体、黄色の目。
  - **線画**: 焦げ茶。

### スプライトポーズ
1.  **Fly (Idle)**: ホバリング。翼をゆっくり上下させる。体も上下する。
2.  **Attack**: 急降下。翼を後ろに畳む。
3.  **Hit**: 逆さまになって回転または落下。目は `× ×`。

### プロンプト
```text
2D game character sprite, fantasy bat monster, cute mascot, round purple body, simple dot eyes, one cute fang, large simple wings, flying pose, vector illustration style, clean bold dark-brown outlines, white background
```

## 3. Boss (ステージ3 ボス)
- **役割**: ステージ3 ラスボス
- **サイズ**: 大 (約 64x64px 以上)。プレイヤーの2倍。

### コンセプト (ドラフト)
- **名前**: "Dark General" または "Demon King" (ちびキャラ版)。
- **ビジュアル**:
  - トゲトゲした黒い鎧を着ているが、2頭身プロポーション。
  - **目**: 光る赤いツリ目 (強そうだが可愛げを残す)。
  - **マント**: ボロボロの赤いマント。
- **ポーズ**: 腕を組んで少し浮いている。

### プロンプト
```text
2D game character sprite, fantasy boss monster, chibi demon king, 2 heads tall, dark armor, red cape, glowing red eyes, floating pose, cute but cool, vector illustration style, clean bold dark-brown outlines, white background
```
