# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 「実装が複雑すぎるため後回し」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

### 実装可能なタスクのみを計画
- 計画段階で「実装可能なタスク」のみをリストアップ
- 「将来やるかもしれないタスク」は含めない
- 「検討中のタスク」は含めない

### タスクスキップが許可される唯一のケース
以下の技術的理由に該当する場合のみスキップ可能:
- 実装方針の変更により、機能自体が不要になった
- アーキテクチャ変更により、別の実装方法に置き換わった
- 依存関係の変更により、タスクが実行不可能になった

スキップ時は必ず理由を明記:
```markdown
- [x] ~~タスク名~~（実装方針変更により不要: 具体的な技術的理由）
```

### タスクが大きすぎる場合
- タスクを小さなサブタスクに分割
- 分割したサブタスクをこのファイルに追加
- サブタスクを1つずつ完了させる

---

## フェーズ1: E-02 設定ファイル

- [x] `src/config-loader.ts` を新規作成
  - [x] `loadConfig(): AppConfig` 関数を実装
  - [x] `~/.claude-code-like/config.json` の読み込み
  - [x] JSON パースエラー時の警告表示とデフォルト値フォールバック
  - [x] 未知のキーの無視、provider フィールドのバリデーション
- [x] `src/index.ts` を修正して `loadConfig()` を統合
  - [x] DEFAULT_CONFIG の代わりに loadConfig() の結果を ProviderFactory に渡す
- [x] `tests/unit/config-loader.test.ts` を作成
  - [x] ファイル不在時のデフォルト値テスト
  - [x] 正常な config 読み込みテスト
  - [x] 不正 JSON 時のフォールバックテスト

## フェーズ2: E-05 API 通信ログ

- [x] `src/debug-logger.ts` を新規作成
  - [x] `DebugLogger` クラスを実装
  - [x] `logRequest(params)` / `logResponse(response)` メソッド
  - [x] JSONL 形式の非同期書き込み（fire-and-forget）
  - [x] API キー・Authorization ヘッダーのマスキング
  - [x] `~/.claude-code-like/logs/` ディレクトリの自動作成
- [x] `src/agent/agent-loop.ts` を修正して DebugLogger を統合
  - [x] constructor に `debugLogger?: DebugLogger` オプション追加
  - [x] createMessage 前後で logRequest / logResponse を呼び出し
- [x] `src/index.ts` を修正して DebugLogger を Repl 経由で AgentLoop に渡す
- [x] `tests/unit/debug-logger.test.ts` を作成
  - [x] enabled=false 時の no-op テスト
  - [x] ログ記録の正常系テスト
  - [x] API キーマスキングテスト

## フェーズ3: E-01 会話履歴永続化

- [x] `src/agent/conversation-store.ts` を新規作成
  - [x] `ConversationStore` クラスを実装
  - [x] `save(record)` メソッド（JSON 書き込み）
  - [x] `loadById(id)` メソッド
  - [x] `loadLatest()` メソッド（updatedAt 最新）
  - [x] `list()` メソッド（メタデータのみ返却）
  - [x] ディレクトリの自動作成
- [x] `src/cli/repl.ts` を修正して ConversationStore を統合
  - [x] ConversationRecord の生成と管理（UUID、summary、タイムスタンプ）
  - [x] AgentLoop.run() 完了ごとに save() を呼び出し
  - [x] --resume 時の会話復元
  - [x] SIGINT/SIGTERM 時の即時保存
- [x] `src/index.ts` を修正して --list 時の会話一覧表示
- [x] `tests/unit/conversation-store.test.ts` を作成
  - [x] save/loadById の正常系テスト
  - [x] loadLatest のテスト
  - [x] list のメタデータ取得テスト
  - [x] ファイル不在時の null 返却テスト

## フェーズ4: E-03 表示改善

- [x] `src/cli/display.ts` を修正してスピナー機能を追加
  - [x] `startSpinner()` / `stopSpinner()` 関数を追加
  - [x] ora インスタンスの管理
- [x] `src/cli/display.ts` に Markdown レンダリング機能を追加
  - [x] `renderMarkdown(text: string): string` 関数を追加
  - [x] marked + marked-terminal の設定
- [x] `src/cli/display.ts` に diff ハイライト機能を追加
  - [x] `formatDiff(oldStr: string, newStr: string): string` 関数を追加
  - [x] chalk で +行:緑、-行:赤のカラーリング
- [x] `src/cli/repl.ts` を修正してスピナーを統合
  - [x] AgentLoop の onToken 呼び出し時にスピナー停止
  - [x] API 呼び出し開始時にスピナー開始
- [x] `src/agent/agent-loop.ts` にスピナー制御コールバックを追加
  - [x] `onThinking?: () => void` コールバックを追加
  - [x] API 呼び出し直前に onThinking を呼び出し
- [x] Markdown レンダリングを AgentLoop の出力に適用
  - [x] ストリーミング中は raw テキスト出力（displayToken 経由）
  - [x] renderMarkdown 関数を公開（将来の非ストリーミングモード用）

## フェーズ5: 品質チェックと修正

- [x] すべてのテストが通ることを確認
  - [x] `npm test` — 110テスト全パス
- [x] 型エラーがないことを確認
  - [x] `npm run typecheck` — エラーなし
- [x] 既存テスト（94件）が壊れていないことを確認

## フェーズ6: ドキュメント更新

- [x] 実装後の振り返り（このファイルの下部に記録）

---

## 実装後の振り返り

### 実装完了日
2026-03-07

### 計画と実績の差分

**計画と異なった点**:
- Markdown レンダリングは end_turn 後の再レンダリング方式ではなく、ストリーミング中は raw テキスト出力 + renderMarkdown 関数を公開する方式に変更。ストリーミングと Markdown レンダリングの二重出力問題を回避した
- `marked-terminal` に型定義がなく `@ts-expect-error` が必要だった
- `--list` の処理を Repl 内ではなく index.ts で直接実行する方式に変更（null as unknown as Provider キャストを避けるため）

**新たに必要になったタスク**:
- コードレビュー指摘の修正（C-1: saveSync メソッド追加、C-2: --list の分離、C-3: DebugLogger 初期化の同期化、W-1: config-loader の依存方向修正、W-3: 未使用コード削除、W-4: 重複ロジック共通化）

**技術的理由でスキップしたタスク**: なし

### 学んだこと

**技術的な学び**:
- `marked-terminal` は `marked.MarkedExtension` 型と互換性がなく、型アサーションが必要
- SIGINT/SIGTERM ハンドラでの保存は同期 API（writeFileSync）を使う必要がある（process.exit 前に async が完了する保証がない）
- ora のスピナーと readline の共存: displayToken 内で stopSpinner() を呼ぶだけで自然に切り替わる
- DebugLogger のような fire-and-forget パターンでは、初期化（mkdir）はコンストラクタで同期的に行うべき

**プロセス上の改善点**:
- フェーズ分割が適切だった（設定→ログ→履歴→表示の順で依存関係を最小化）
- コードレビューサブエージェントの活用が効果的で、SIGTERM 保存の問題やアーキテクチャ違反を早期に発見できた

### 次回への改善提案
- `marked-terminal` の型定義ファイル（`.d.ts`）を作成して `@ts-expect-error` を排除する
- ConversationStore の list() は件数が増えた場合にメタデータインデックスファイル方式に移行する
- DebugLogger にリクエスト/レスポンスの対応付け（requestId）を追加して解析を容易にする
