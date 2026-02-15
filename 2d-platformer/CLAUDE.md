# プロジェクトルール

## 技術スタック
- C++17 / SFML 2.6 / CMake
- ビルド: mkdir build && cd build && cmake .. && make

## コーディング規約
- クラス名: PascalCase（Player, TileMap）
- メソッド名: camelCase（handleInput, update）
- メンバ変数: camelCase（moveSpeed, currentState）
- 定数: UPPER_SNAKE_CASE（MAX_HP, TILE_SIZE）
- ヘッダーガード: #pragma once
- インクルード順: 標準ライブラリ → SFML → プロジェクト内

## 設計方針
- Entity基底クラスを継承してPlayer/Enemyを実装
- シーン管理はScene基底クラスのポリモーフィズム
- リソースはResourceManagerで一元管理
- 当たり判定はAABB、X軸/Y軸分離で解決
- コードの品質・可読性を重視し、設計通りの実装を徹底する

## ファイル構成
- src/ 以下にソースコード
- assets/ 以下にリソース
- 1クラス = 1ヘッダー + 1ソースファイル
