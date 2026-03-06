import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parseFrontmatter } from './frontmatter.js';
import type { AgentDefinition } from '../types/index.js';

/**
 * エージェント定義ファイル(.md)を読み込み、エージェントを管理するローダー
 */
export class AgentLoader {
  private agents = new Map<string, AgentDefinition>();
  private loaded = false;

  async loadAgents(dirs: string[]): Promise<void> {
    if (this.loaded) return;

    for (const dir of dirs) {
      if (!existsSync(dir)) continue;

      const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
      for (const file of files) {
        const filePath = join(dir, file);
        try {
          const content = readFileSync(filePath, 'utf-8');
          const { attributes, body } = parseFrontmatter(content);

          const toolsRaw = attributes.tools;
          const tools = typeof toolsRaw === 'string'
            ? toolsRaw.split(',').map((t) => t.trim())
            : Array.isArray(toolsRaw)
            ? (toolsRaw as string[])
            : [];

          const agent: AgentDefinition = {
            name: (attributes.name as string) ?? basename(file, '.md'),
            description: (attributes.description as string) ?? '',
            tools,
            model: attributes.model as string | undefined,
            instructions: body,
            filePath,
          };

          this.agents.set(agent.name, agent);
        } catch (error) {
          console.warn(`エージェントファイルの読み込みに失敗: ${filePath}: ${(error as Error).message}`);
        }
      }
    }

    this.loaded = true;
  }

  /** エージェント名で解決する */
  resolve(name: string): AgentDefinition | null {
    return this.agents.get(name) ?? null;
  }

  /** 登録済みエージェント一覧を返す */
  listAgents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }
}
