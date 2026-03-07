# 要求内容

## 概要

claude-code-like の Post-MVP 拡張機能（E-01 会話履歴永続化、E-02 設定ファイル、E-03 表示改善、E-05 API通信ログ）を一括実装する。

## 背景

MVP フェーズで基本的な REPL・Tool Use ループ・マルチプロバイダー対応が完成した。次のステップとして、実用性を高める4つの拡張機能を実装し、日常的な開発支援ツールとしての完成度を上げる。

## 実装対象の機能

### 1. E-01: 会話履歴永続化

- 会話を JSON ファイルとして `~/.claude-code-like/conversations/` に自動保存する
- `--resume [conversation-id]` で指定した会話を再開できる（ID 省略時は最新の会話を自動選択）
- `--list` フラグで過去の会話一覧を表示できる
- 各会話にはタイムスタンプとサマリー（最初のユーザーメッセージ先頭100文字）を付与する
- SIGINT / SIGTERM 受信時に会話履歴を即時保存してから終了する

### 2. E-02: 設定ファイル

- `~/.claude-code-like/config.json` から設定を読み込む
- 設定項目: model, maxTokens, timeout, theme, provider
- 設定ファイルが存在しない場合はデフォルト値を使用する
- API キー取得は環境変数から（実装済み）

### 3. E-03: 表示改善

- AI 思考中に `ora` によるスピナーを表示する
- Markdown を `marked` + `marked-terminal` でターミナル向けにレンダリングする
- `chalk` でツール名、ファイルパス、エラーメッセージを色分けする（部分的に実装済み）
- diff 表示時にシンタックスハイライトを適用する

### 4. E-05: API 通信ログ

- `--debug` フラグで API リクエスト/レスポンスをローカルファイルに記録する
- ログファイルは `~/.claude-code-like/logs/` に日時付き（YYYY-MM-DD.jsonl）で格納する
- API キーなどのセンシティブ情報はマスキングして記録する
- ログ出力はパフォーマンスに影響を与えない（非同期書き込み）

## 受け入れ条件

### E-01: 会話履歴永続化
- [x] 会話を JSON ファイルとして自動保存する
- [x] `--resume [id]` で会話を再開できる（ID 省略時は最新）
- [x] `--list` で過去の会話一覧を表示できる
- [x] SIGINT/SIGTERM 時に即時保存する

### E-02: 設定ファイル
- [x] `~/.claude-code-like/config.json` から設定を読み込む
- [x] 設定ファイル不在時はデフォルト値を使用する

### E-03: 表示改善
- [x] ora スピナーを表示する
- [x] Markdown をターミナルレンダリングする
- [x] diff 表示にハイライトを適用する

### E-05: API 通信ログ
- [x] `--debug` で API 通信をログに記録する
- [x] API キーをマスキングする
- [x] 非同期書き込みでパフォーマンス影響なし

## 成功指標

- 全テスト（94件+新規）がパスする
- `npm run typecheck` がエラーなし
- 1ファイル300行以下を維持

## スコープ外

以下はこのフェーズでは実装しません:

- E-04: API プロバイダ抽象化（実装済み）
- テーマ切り替えの UI（theme 設定は config に含めるが、実際のテーマ適用は将来対応）
- 会話履歴の検索機能
- ログファイルのローテーション/自動削除

## 参照ドキュメント

- `docs/product-requirements.md` - PRD の E-01〜E-05 セクション
- `docs/functional-design.md` - ConversationRecord, ConversationStore, AppConfig の型定義
- `docs/architecture.md` - データ永続化戦略、セキュリティアーキテクチャ
- `docs/repository-structure.md` - ファイル配置ルール
- `docs/development-guidelines.md` - コーディング規約
