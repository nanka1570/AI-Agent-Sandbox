---
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
description: 指定したPhaseを自動実装する
---

# Phase $ARGUMENTS の自動実装

## 手順

1. `docs/progress.md` を読み、現在のPhase状況を確認する
2. 設計書を確認する:
   - `docs/01_要件定義書_v1_0.md`（要件）
   - `docs/02_基本設計書_v1_0.md`（API仕様）
   - `docs/04_画面設計書_v1_0.md`（画面仕様）
   - `docs/05_詳細設計書_v1_0.md`（詳細仕様）
3. `CLAUDE.md` を読み、コーディング規約を確認する
4. Phase $ARGUMENTS の作業内容を実装する
5. 完了基準を全て満たしているか確認する:
   - `npm run build` が成功すること
   - `npx tsc --noEmit` で型エラーがないこと
   - `npm run lint` でリントエラーがないこと
   - テストがある場合は `npm run test` が PASS すること
6. `reviewer` エージェントでコードレビューを実施する
7. 問題があれば修正する
8. `docs/progress.md` を更新する（Phase $ARGUMENTS を完了に変更）
9. git add → git commit → git push origin main を実行する

## コミットメッセージ
docs/01_要件定義書_v1_0.md の該当Phaseに記載されたコミットメッセージを使用する。
docs/progress.md の該当Phaseを完了に更新する。

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
