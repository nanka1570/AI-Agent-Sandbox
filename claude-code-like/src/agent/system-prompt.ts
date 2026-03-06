import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CommandDefinition } from '../types/index.js';

const BASE_SYSTEM_PROMPT = `あなたはターミナルで動作する AI ペアプログラマーです。
ユーザーの開発タスクを支援するために、提供されたツールを使用してファイルの読み書き、コマンド実行、コード検索を行います。

## ツール使用方針
- ファイルを読むには Read ツールを使用
- ファイルを作成・上書きするには Write ツールを使用
- ファイルの一部を編集するには Edit ツールを使用
- シェルコマンドを実行するには Bash ツールを使用
- ファイルを検索するには Glob ツールを使用
- コード内容を検索するには Grep ツールを使用
- スキルを読み込むには Skill ツールを使用
- サブエージェントに作業を委譲するには SubAgent ツールを使用

## 応答方針
- 簡潔かつ正確に応答する
- ツールを使って情報を確認してから回答する
- エラーが発生した場合は代替手段を検討する`;

export class SystemPromptManager {
  private cwd: string;

  constructor(cwd?: string) {
    this.cwd = cwd ?? process.cwd();
  }

  build(options?: { command?: CommandDefinition }): string {
    const parts: string[] = [BASE_SYSTEM_PROMPT];

    const claudeMd = this.loadClaudeMd();
    if (claudeMd) {
      parts.push(`\n\n## プロジェクト設定 (CLAUDE.md)\n\n${claudeMd}`);
    }

    if (options?.command) {
      parts.push(`\n\n## コマンド: ${options.command.name}\n\n${options.command.body}`);
    }

    // Skill はツール結果（tool_result）として messages に注入する方式を採用しているため、
    // システムプロンプトには含めない

    return parts.join('');
  }

  /** CLAUDE.md を読み込む。存在しない場合は null を返す */
  private loadClaudeMd(): string | null {
    const claudeMdPath = resolve(this.cwd, 'CLAUDE.md');
    try {
      return readFileSync(claudeMdPath, 'utf-8');
    } catch {
      return null;
    }
  }
}
