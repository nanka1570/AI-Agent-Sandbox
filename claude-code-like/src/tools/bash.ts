import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { ToolDefinition, ToolResult } from '../types/index.js';
import { TOOL_DEFAULTS } from '../constants.js';

const execAsync = promisify(exec);

export function createBashTool(options?: { timeout?: number }): ToolDefinition {
  const timeout = (options?.timeout ?? TOOL_DEFAULTS.BASH_TIMEOUT_SECONDS) * 1000;

  return {
    name: 'Bash',
    description: 'シェルコマンドを実行します。',
    input_schema: {
      type: 'object' as const,
      properties: {
        command: { type: 'string', description: '実行するシェルコマンド' },
        timeout: { type: 'number', description: 'タイムアウト秒数（デフォルト: 120）' },
      },
      required: ['command'],
    },
    requiresConfirmation: true,
    handler: async (input): Promise<ToolResult> => {
      const command = input.command as string;
      const cmdTimeout = input.timeout ? (input.timeout as number) * 1000 : timeout;

      try {
        const { stdout, stderr } = await execAsync(command, {
          timeout: cmdTimeout,
          maxBuffer: TOOL_DEFAULTS.BASH_MAX_BUFFER_BYTES,
          killSignal: 'SIGTERM',
        });
        const parts: string[] = [];
        if (stdout) parts.push(stdout);
        if (stderr) parts.push(`[stderr]\n${stderr}`);
        parts.push('[exit code: 0]');
        return { content: parts.join('\n') || '(コマンドは正常に完了しました)' };
      } catch (error: unknown) {
        const execError = error as {
          killed?: boolean;
          code?: number;
          stdout?: string;
          stderr?: string;
          message?: string;
        };
        if (execError.killed) {
          const partial = execError.stdout || execError.stderr || '';
          return {
            content: `タイムアウト (${cmdTimeout / 1000}秒)${partial ? '\n部分出力:\n' + partial : ''}`,
            is_error: true,
          };
        }
        const output = execError.stderr || execError.stdout || execError.message || '不明なエラー';
        const exitCode = execError.code != null ? `\n[exit code: ${execError.code}]` : '';
        return { content: `${output}${exitCode}`, is_error: true };
      }
    },
  };
}
