import { readFileSync, existsSync } from 'node:fs';
import type { ToolDefinition, ToolResult } from '../types/index.js';
import { TOOL_DEFAULTS } from '../constants.js';

export function createReadTool(): ToolDefinition {
  return {
    name: 'Read',
    description: 'ファイルの内容を読み取ります。行番号付きで返却します。',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_path: { type: 'string', description: '読み込むファイルのパス' },
        offset: { type: 'number', description: '開始行（1始まり）' },
        limit: { type: 'number', description: '読み込む行数（デフォルト: 2000）' },
      },
      required: ['file_path'],
    },
    handler: async (input): Promise<ToolResult> => {
      const filePath = input.file_path as string;
      const offset = (input.offset as number | undefined) ?? 1;
      const limit = (input.limit as number | undefined) ?? TOOL_DEFAULTS.READ_MAX_LINES;

      if (!existsSync(filePath)) {
        return { content: `ファイルが見つかりません: ${filePath}`, is_error: true };
      }

      try {
        const buffer = readFileSync(filePath);
        // バイナリ判定: null バイトが含まれるか
        if (buffer.includes(0)) {
          return { content: 'バイナリファイルのため読み取りをスキップしました' };
        }

        const content = buffer.toString('utf-8');
        const lines = content.split('\n');
        const startIndex = Math.max(0, offset - 1);
        const selectedLines = lines.slice(startIndex, startIndex + limit);

        const numbered = selectedLines
          .map((line, i) => `${String(startIndex + i + 1).padStart(6, ' ')}\t${line}`)
          .join('\n');

        return { content: numbered };
      } catch (error) {
        return { content: `読み取りエラー: ${(error as Error).message}`, is_error: true };
      }
    },
  };
}
