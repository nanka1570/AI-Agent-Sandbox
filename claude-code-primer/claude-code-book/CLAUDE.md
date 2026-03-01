# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

バニラ JS + Canvas 2D API で実装したブロック崩しゲーム。ビルドツール・フレームワーク・依存パッケージなし。

- `index.html` — ゲーム画面のレイアウトと UI（Canvas、スコア表示、ボタン）
- `main.js` — ゲームロジック・描画・入力処理のすべて

## 開発サーバーの起動

```bash
npx http-server . -p 8080
```

ブラウザで http://127.0.0.1:8080 を開く。ファイルを編集したらブラウザをリロードするだけで反映される。

## アーキテクチャ

`main.js` は以下の構造で動作する。

```
初期描画 (draw)
  ↓
startGame() でゲームループ開始
  ↓
gameLoop() = update() → draw() → requestAnimationFrame(gameLoop)
```

**状態管理**
- `gameState`: `'idle'` | `'playing'` | `'gameover'` | `'clear'` の4状態
- `ball.stuck`: `true` の間はボールがパドルに追従し、スペース/クリックで `false` になり発射

**当たり判定**
- `circleRect()`: 円（ボール）と矩形（ブロック・パドル）の衝突を最近点距離で判定
- `reflectBall()`: 上下・左右のめりこみ量を比較し、小さい面への衝突として反射方向を決定
- パドル反射は `hitPos`（-1〜1）でvxを変化させ、端に当てると角度が変わる

**レベル進行**
- 全ブロック破壊でレベルアップ、最大レベル3まで
- レベルが上がるたびにボール速度が `+0.5` される（`resetBall` 内）
