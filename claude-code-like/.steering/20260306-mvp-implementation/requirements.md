# 要求内容

## 概要
claude-code-like の MVP 全体（C-01〜C-11）を実装する。

## 要求元
ユーザーが提示した実装計画に基づく。

## スコープ
- Phase 1: プロジェクト初期化 + 型定義 + コアフレームワーク
- Phase 2: コアツール 6 種 (C-02〜C-07)
- Phase 3: 拡張機構 (C-09, C-10, C-11)

## 前提条件
- 永続ドキュメント 6 つが完成済み
- ソースコードは未着手（package.json のみ存在）

## 成功条件
- `npm run typecheck` エラー 0 件
- `npm test` 全テストパス
- `npm run test:coverage` ツール単体 80% 以上
- `npm run dev` で 10 ターン以上の連続対話が安定動作
- `/help` でコマンド一覧表示
- `Skill('name')`, `SubAgent('name')` がツール結果を返却
