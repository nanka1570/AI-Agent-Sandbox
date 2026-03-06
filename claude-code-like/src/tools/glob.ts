import fg from 'fast-glob';
import type { ToolDefinition, ToolResult } from '../types/index.js';

export function createGlobTool(): ToolDefinition {
  return {
    name: 'Glob',
    description: 'glob パターンでファイルを検索します。',
    input_schema: {
      type: 'object' as const,
      properties: {
        pattern: { type: 'string', description: 'glob パターン' },
        path: { type: 'string', description: '検索ディレクトリ（デフォルト: cwd）' },
      },
      required: ['pattern'],
    },
    handler: async (input): Promise<ToolResult> => {
      const pattern = input.pattern as string;
      const cwd = (input.path as string | undefined) ?? process.cwd();

      try {
        const files = await fg(pattern, {
          cwd,
          ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
          absolute: true,
          onlyFiles: true,
        });

        if (files.length === 0) {
          return { content: 'マッチするファイルが見つかりませんでした' };
        }

        return { content: files.join('\n') };
      } catch (error) {
        return { content: `検索エラー: ${(error as Error).message}`, is_error: true };
      }
    },
  };
}
