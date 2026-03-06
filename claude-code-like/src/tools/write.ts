import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ToolDefinition, ToolResult } from '../types/index.js';

export function createWriteTool(options?: {
  onConfirm?: (message: string) => Promise<boolean>;
}): ToolDefinition {
  return {
    name: 'Write',
    description: 'ファイルを作成または上書きします。',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_path: { type: 'string', description: '書き込み先ファイルパス' },
        content: { type: 'string', description: '書き込む内容' },
      },
      required: ['file_path', 'content'],
    },
    handler: async (input): Promise<ToolResult> => {
      const filePath = input.file_path as string;
      const content = input.content as string;

      // 既存ファイルの上書き時は確認
      if (existsSync(filePath) && options?.onConfirm) {
        const confirmed = await options.onConfirm(`Write: ${filePath} を上書きします`);
        if (!confirmed) {
          return { content: 'ユーザーが実行を拒否しました', is_error: true };
        }
      }

      try {
        const dir = dirname(filePath);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        writeFileSync(filePath, content, 'utf-8');
        const lineCount = content.split('\n').length;
        return { content: `${filePath} (${lineCount} lines)` };
      } catch (error) {
        return { content: `書き込みエラー: ${(error as Error).message}`, is_error: true };
      }
    },
  };
}
