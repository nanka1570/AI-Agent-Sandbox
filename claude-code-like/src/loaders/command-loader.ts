import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parseFrontmatter } from './frontmatter.js';
import type { CommandDefinition } from '../types/index.js';

/**
 * コマンド定義ファイル(.md)を読み込み、コマンドを管理するローダー
 */
export class CommandLoader {
  private commands = new Map<string, CommandDefinition>();
  private loaded = false;

  async loadCommands(dirs: string[]): Promise<void> {
    if (this.loaded) return;

    for (const dir of dirs) {
      if (!existsSync(dir)) continue;

      const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
      for (const file of files) {
        const filePath = join(dir, file);
        try {
          const content = readFileSync(filePath, 'utf-8');
          const { attributes, body } = parseFrontmatter(content);
          const name = basename(file, '.md');

          const allowedToolsRaw = attributes['allowed-tools'];
          const allowedTools = typeof allowedToolsRaw === 'string'
            ? allowedToolsRaw.split(',').map((t) => t.trim())
            : undefined;

          const command: CommandDefinition = {
            name,
            description: (attributes.description as string) ?? '',
            allowedTools,
            body,
            filePath,
          };

          this.commands.set(name, command);
        } catch (error) {
          console.warn(`コマンドファイルの読み込みに失敗: ${filePath}: ${(error as Error).message}`);
        }
      }
    }

    this.loaded = true;
  }

  /** コマンド名で解決する。ビルトインコマンドは null を返す */
  resolve(name: string): CommandDefinition | null {
    if (this.isBuiltinCommand(name)) return null;
    return this.commands.get(name) ?? null;
  }

  /** 登録済みコマンド一覧を返す */
  listCommands(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  /** ヘルプ表示用フォーマット */
  formatHelp(): string {
    const commands = this.listCommands();
    if (commands.length === 0) return '利用可能なコマンドはありません';
    return commands
      .map((c) => `  /${c.name}  - ${c.description}`)
      .join('\n');
  }

  /** ビルトインコマンドかどうかを判定する */
  isBuiltinCommand(name: string): boolean {
    return name === 'help';
  }
}
