# 設計書

## アーキテクチャ概要

既存のレイヤードアーキテクチャに沿って、各機能を適切なレイヤーに配置する。

```
CLI レイヤー
├── index.ts        ← CLI 引数解析、config 読み込み、--list / --resume 処理
├── repl.ts         ← ConversationStore 統合、SIGINT 保存、スピナー制御
└── display.ts      ← Markdown レンダリング、diff ハイライト

エージェントレイヤー
├── agent-loop.ts   ← debug ログ呼び出し
└── conversation-store.ts ← 会話の保存・復元・一覧（新規）

ユーティリティ
├── config-loader.ts    ← 設定ファイル読み込み（新規、src/ 直下）
└── debug-logger.ts     ← API 通信ログ（新規、src/ 直下）
```

## コンポーネント設計

### 1. ConversationStore（新規: `src/agent/conversation-store.ts`）

**責務**:
- 会話の JSON ファイル保存・復元
- 会話一覧のメタデータ取得

**実装の要点**:
- functional-design.md の `ConversationStore` クラス設計に準拠
- `ConversationRecord` 型（types/conversation.ts に定義済み）を使用
- 保存先: `~/.claude-code-like/conversations/[uuid].json`
- 一覧表示: メタデータ（id, summary, createdAt, updatedAt）のみ返却
- UUID 生成: `crypto.randomUUID()`

```typescript
class ConversationStore {
  constructor(baseDir?: string);
  save(record: ConversationRecord): Promise<void>;
  loadLatest(): Promise<ConversationRecord | null>;
  loadById(id: string): Promise<ConversationRecord | null>;
  list(): Promise<Pick<ConversationRecord, 'id' | 'summary' | 'createdAt' | 'updatedAt'>[]>;
}
```

### 2. ConfigLoader（新規: `src/config-loader.ts`）

**責務**:
- `~/.claude-code-like/config.json` の読み込み
- デフォルト値とのマージ

**実装の要点**:
- ファイル不在時は DEFAULT_CONFIG をそのまま返却
- JSON パースエラー時は警告を表示してデフォルト値を使用
- 未知のキーは無視（将来の互換性）
- provider フィールドのバリデーション（'anthropic' | 'gemini' | 'groq' | 'openrouter' のみ許可）

```typescript
function loadConfig(): AppConfig;
```

### 3. DebugLogger（新規: `src/debug-logger.ts`）

**責務**:
- API リクエスト/レスポンスの JSONL 形式ログ記録
- センシティブ情報のマスキング

**実装の要点**:
- `--debug` フラグ無効時は何もしない（no-op）
- ログファイル: `~/.claude-code-like/logs/YYYY-MM-DD.jsonl`
- 非同期書き込み: `fs.appendFile` を fire-and-forget（await しない）
- マスキング: API キー、Authorization ヘッダーを `***` に置換

```typescript
class DebugLogger {
  constructor(enabled: boolean, baseDir?: string);
  logRequest(params: CreateMessageParams): void;
  logResponse(response: LLMResponse): void;
}
```

### 4. 表示改善（`src/cli/display.ts` 拡張）

**責務**:
- ora スピナーの表示制御
- Markdown のターミナルレンダリング
- diff のハイライト表示

**実装の要点**:
- スピナー: API 呼び出し前に開始、最初のトークン受信で停止
- Markdown: `marked` + `marked-terminal` で end_turn 時にレンダリング
- diff: `diff` パッケージの結果に chalk でカラーリング（+行:緑、-行:赤）
- スピナーとストリーミングの共存: スピナーを stop してからトークン出力

### 5. Repl 拡張（`src/cli/repl.ts` 修正）

**責務**:
- ConversationStore を使った会話の保存・復元
- SIGINT/SIGTERM 時の即時保存

**実装の要点**:
- start() 内で --resume 時は ConversationStore から復元
- AgentLoop.run() 完了ごとに ConversationStore.save()
- SIGINT ハンドラで即時保存
- --list 時は一覧表示して終了

### 6. index.ts 拡張

**責務**:
- ConfigLoader による設定読み込み
- DebugLogger の初期化
- --list 時の会話一覧表示

## データフロー

### 会話保存フロー
```
1. ユーザー入力 → AgentLoop.run() 完了
2. Repl が ConversationStore.save() を呼び出し
3. ConversationStore が ~/.claude-code-like/conversations/[uuid].json に書き込み
```

### 会話復元フロー（--resume）
```
1. index.ts が --resume [id] を解析
2. Repl.start() で ConversationStore.loadById(id) を呼び出し
3. 復元した messages を ConversationContext.messages に設定
4. 通常の REPL ループ開始
```

### API ログフロー
```
1. AgentLoop が provider.createMessage() を呼び出す前後
2. DebugLogger.logRequest() / logResponse() を呼び出し
3. DebugLogger が非同期で ~/.claude-code-like/logs/YYYY-MM-DD.jsonl に追記
```

## エラーハンドリング戦略

### ConfigLoader
- ファイル不在: デフォルト値を返却（正常動作）
- JSON パースエラー: `displayWarning()` で警告表示、デフォルト値を返却

### ConversationStore
- ディレクトリ不在: `mkdir -p` 相当で自動作成
- ファイル読み込みエラー: null を返却（新規会話として開始）
- 書き込みエラー: `displayWarning()` で警告表示（会話は継続）

### DebugLogger
- ディレクトリ不在: 自動作成
- 書き込みエラー: 静かに無視（ログ失敗でメインフローを止めない）

## テスト戦略

### ユニットテスト
- `ConversationStore`: save/load/list の正常系・異常系
- `loadConfig`: ファイル有無・パースエラー
- `DebugLogger`: ログ記録・マスキング
- `display.ts`: Markdown レンダリング、diff ハイライト

### 統合テスト
- AgentLoop + DebugLogger の連携
- Repl + ConversationStore の保存・復元フロー

## 依存ライブラリ

新規追加なし。既に package.json に含まれるライブラリを使用:
- `ora` (スピナー)
- `marked` + `marked-terminal` (Markdown レンダリング)
- `chalk` (カラー出力)
- `diff` (diff 表示)

## ディレクトリ構造

```
src/
├── config-loader.ts          # 新規: 設定ファイル読み込み
├── debug-logger.ts           # 新規: API 通信ログ
├── agent/
│   └── conversation-store.ts # 新規: 会話履歴ストア
├── cli/
│   ├── display.ts            # 修正: スピナー・Markdown・diff
│   └── repl.ts               # 修正: 会話保存・復元・SIGINT
└── index.ts                  # 修正: config 読み込み、--list 処理
```

## 実装の順序

1. E-02 設定ファイル（他の機能の基盤）
2. E-05 API 通信ログ（独立性が高い）
3. E-01 会話履歴永続化（Repl 変更が大きい）
4. E-03 表示改善（最後に UI を仕上げる）

## セキュリティ考慮事項

- API キーを config.json に保存しない（環境変数のみ）
- DebugLogger で API キーをマスキング
- `~/.claude-code-like/` ディレクトリのパーミッションを 700 に設定

## パフォーマンス考慮事項

- DebugLogger の書き込みは非同期（await しない）
- ConversationStore の一覧は メタデータのみ読み込み（全文読み込みは resume 時のみ）
- スピナーの CPU 使用は ora のデフォルト設定で十分低い
