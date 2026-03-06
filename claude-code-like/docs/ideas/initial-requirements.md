# Claude Code ライクな CLI AI Agent - 初期要件

## 課題

ターミナルで完結する AI ペアプログラマーが欲しい。既存の Claude Code の仕組みを理解し、自作することで AI Agent の設計パターンを学ぶ。
SaaS 型 AI ツールはデータフローが不透明で、機密案件では利用できない。API 直接通信で完全に管理可能なツールが必要。

## コンセプト

「ターミナルで動く AI ペアプログラマー」

- ユーザーが自然言語で指示を出す
- AI がコードベースを読み、編集し、コマンドを実行する
- Tool Use（Function Calling）ベースの自律的なエージェント

### セキュリティの差別化ポイント

- **SaaS 仲介層の排除**: Anthropic API への直接通信のみ。中間サーバーを経由しない
- **送信内容の完全な把握**: どのデータが API に送られるかをコードレベルで確認可能
- **通信ログの監査可能性**: `--debug` フラグで全 API 通信をローカルに記録
- **テレメトリなし**: 利用状況の外部送信を一切行わない
- **オープンソース**: 通信経路・データ処理を誰でも検証可能

## コア機能 (P0)

### C-01: 対話ループ（REPL）

- `node:readline/promises` による入力受付
- Anthropic SDK のストリーミング API でリアルタイム表示
- `Ctrl+C` で中断、`exit` / `quit` で終了
- 複数ターンの会話コンテキスト維持

### C-02: Read ツール

- ファイルの内容を読み取る
- 行番号付きで表示（AI が行を参照できるように）
- offset / limit パラメータで部分読み取り対応
- バイナリファイルはスキップ

### C-03: Write ツール

- ファイルの新規作成・上書き
- 実行前に確認プロンプト（既存ファイル上書き時）
- 親ディレクトリの自動作成

### C-04: Edit ツール

- old_string → new_string による部分編集
- diff 表示で変更内容を可視化
- old_string が見つからない場合はエラー

### C-05: Bash ツール

- シェルコマンドの実行
- 実行前に確認プロンプト
- タイムアウト設定（デフォルト 120 秒）
- stdout / stderr の返却

### C-06: Glob ツール

- glob パターンによるファイルパス検索
- `fast-glob` ライブラリ使用
- node_modules 等のデフォルト除外

### C-07: Grep ツール

- 正規表現によるファイル内容検索
- マッチした行番号とコンテキスト行を返却
- バイナリファイルはスキップ

### C-08: システムプロンプト管理

- カレントディレクトリの `CLAUDE.md` を自動読み込み
- システムプロンプトに注入
- 存在しない場合はスキップ

### C-09: コマンドシステム

- `.commands/*.md` を読み込み、`/コマンド名` で実行
- YAML frontmatter（description, allowed-tools）+ Markdown 手順書
- `/` プレフィックスで認識、ファイル名をコマンド名として実行
- コマンド内容をシステムプロンプトに注入して AI に実行させる

### C-10: スキルシステム

- `.skills/[name]/SKILL.md` + テンプレートファイルを読み込み
- `Skill('name')` で呼び出し
- SKILL.md（YAML frontmatter + ガイド）+ template.md + 任意の追加ファイル
- スキル内容をコンテキストに注入して AI の振る舞いを拡張する

### C-11: サブエージェント

- 独立した会話コンテキストでツール制限付き作業を実行
- `.agents/[name].md`（YAML frontmatter: name, description, tools）
- メイン会話とは別の messages 配列で実行
- 結果をメイン会話に返却
- 使用可能なツールをエージェント定義の `tools` フィールドで制限

## 拡張機能 (P1)

### E-01: 会話履歴永続化

- 会話を JSON ファイルとして保存
- `~/.claude-code-like/conversations/` に格納
- 会話一覧の表示
- 過去の会話の再開（resume）

### E-02: 設定ファイル

- `~/.claude-code-like/config.json`
- 設定項目:
  - model: 使用モデル（デフォルト: claude-sonnet-4-20250514）
  - maxTokens: 最大トークン数
  - timeout: Bash タイムアウト秒数
  - theme: 配色テーマ

### E-03: 表示改善

- `ora` によるスピナー表示（AI 思考中）
- `marked` + `marked-terminal` による Markdown レンダリング
- `chalk` によるカラー出力
- ツール実行結果のシンタックスハイライト

### E-04: API プロバイダ抽象化

- 将来の Bedrock / Vertex AI 対応に備えた Provider インターフェース
- Anthropic API 直接通信をデフォルト実装として提供
- Provider 切り替えは設定ファイルで行う
- メッセージ形式の変換レイヤーを Provider 側に持たせる

### E-05: API 通信ログ

- `--debug` フラグでリクエスト/レスポンスをローカルファイルに記録
- ログファイルは `~/.claude-code-like/logs/` に格納
- API キーやセンシティブ情報はマスキングして記録
- 監査・トラブルシューティング用途

## スコープ外

- GUI / TUI（Ink 等は使わない。純粋な readline ベース）
- MCP（Model Context Protocol）連携
- 画像入力
- Web 検索

## 技術スタック

| カテゴリ | 選定 |
|---------|------|
| 言語 | TypeScript (strict mode) |
| ランタイム | Node.js 22+ |
| AI SDK | @anthropic-ai/sdk |
| CLI 入力 | node:readline/promises |
| 出力装飾 | chalk v5 |
| Markdown | marked + marked-terminal |
| スピナー | ora |
| Glob | fast-glob |
| diff 表示 | diff |
| テスト | Vitest |
| ビルド | tsup |
| 開発環境 | Dev Container (Node.js 22) |

## 成功基準

1. `npm run dev` で起動し、対話的に質問→回答ができる
2. AI が自律的にファイルを読み書きし、コードを編集できる
3. CLAUDE.md を読み込んでプロジェクト固有のルールに従える
4. `/コマンド名` でカスタムコマンドを実行できる
5. `Skill('name')` でスキルを読み込み、AI の振る舞いを拡張できる
6. サブエージェントに作業を委譲し、結果を受け取れる
7. 会話履歴を保存・再開できる
8. `--debug` で API 通信ログを記録できる
