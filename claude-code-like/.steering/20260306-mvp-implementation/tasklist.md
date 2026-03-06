# タスクリスト

## Phase 1: プロジェクト初期化 + 型定義 + コアフレームワーク

- [x] 1.1 プロジェクト設定（tsconfig.json, vitest.config.ts, tsup.config.ts, .editorconfig, package.json 更新）
- [x] 1.2 型定義（src/types/）
- [x] 1.3 Provider レイヤー（src/providers/）
- [x] 1.4 ToolDispatcher（src/agent/tool-dispatcher.ts）
- [x] 1.5 SystemPromptManager（src/agent/system-prompt.ts）
- [x] 1.6 Display モジュール（src/cli/display.ts）
- [x] 1.7 Confirm モジュール（src/cli/confirm.ts）
- [x] 1.8 AgentLoop（src/agent/agent-loop.ts）
- [x] 1.9 REPL（src/cli/repl.ts）
- [x] 1.10 エントリーポイント（src/index.ts）
- [x] 1.11 Tools バレル（スタブ）（src/tools/index.ts）
- [x] 1.12 Phase 1 検証（typecheck + dev 起動確認）

## Phase 2: コアツール 6 種 (C-02〜C-07)

- [x] 2.1 Read ツール + テスト
- [x] 2.2 Write ツール + テスト
- [x] 2.3 Edit ツール + テスト
- [x] 2.4 Bash ツール + テスト
- [x] 2.5 Glob ツール + テスト
- [x] 2.6 Grep ツール + テスト
- [x] 2.7 Tools バレル更新
- [x] 2.8 AgentLoop 統合テスト
- [x] 2.9 Phase 2 検証（typecheck + test + dev 動作確認）

## Phase 3: 拡張機構 (C-09, C-10, C-11)

- [x] 3.1 Frontmatter パーサー + テスト
- [x] 3.2 CommandLoader + テスト
- [x] 3.3 SkillLoader + テスト
- [x] 3.4 AgentLoader + テスト
- [x] 3.5 Skill ツール + テスト
- [x] 3.6 SubAgent ツール + テスト
- [x] 3.7 Tools バレル更新
- [x] 3.8 REPL コマンド統合
- [x] 3.9 統合テスト（command-execution, sub-agent-loop）
- [x] 3.10 E2E テスト（basic-conversation, file-operations）
- [x] 3.11 Phase 3 検証（typecheck + 全テスト + カバレッジ確認）

## 最終検証

- [x] 4.1 全体検証（typecheck, test, coverage, dev 動作確認）

## 実装後の振り返り

**実装完了日**: 2026-03-06

### 計画と実績の差分
- 計画通り 3 Phase で完了。タスクのスキップなし
- MessageStream 型の import パスが `@anthropic-ai/sdk/lib/MessageStream.js` に変更されていた（SDK バージョン差異）
- frontmatter パーサーで空の frontmatter (`---\n---`) のケースに専用パターンが必要だった
- E2E テストはプロセス起動ではなく AgentLoop クラスを直接テストする形式に変更（stdin/stdout の制御が複雑なため）

### 成果
- ソースファイル: 31 ファイル（src/ 配下）
- テストファイル: 19 ファイル（tests/ 配下）
- テスト数: 61 テスト（全通過）
- カバレッジ: 93.96% (Stmts)、ツール単体 94.45%
- 型チェック: エラー 0 件

### 学んだこと
- Anthropic SDK の MessageStream 型は SDK バージョンによってインポートパスが変わるため注意
- モック Provider の設計は `finalMessage()` を返すシンプルな形で十分（ストリーミングの詳細モックは不要）
- 遅延読み込みパターン（ローダーの initialized フラグ）は起動時間の最適化に効果的
