import { appendFile } from 'node:fs/promises';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { CreateMessageParams, LLMResponse } from './types/index.js';

const DEFAULT_LOG_DIR = join(homedir(), '.claude-code-like', 'logs');

// API キーのパターン: sk-ant-*, key-*, gsk_* 等
const SENSITIVE_PATTERNS = [
  /sk-ant-[a-zA-Z0-9_-]+/g,
  /key-[a-zA-Z0-9_-]+/g,
  /gsk_[a-zA-Z0-9_-]+/g,
  /Bearer\s+[a-zA-Z0-9_.-]+/g,
];

function maskSensitive(text: string): string {
  let masked = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    masked = masked.replace(pattern, '***');
  }
  return masked;
}

function getLogFileName(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}.jsonl`;
}

export class DebugLogger {
  private enabled: boolean;
  private logDir: string;

  constructor(enabled: boolean, logDir: string = DEFAULT_LOG_DIR) {
    this.enabled = enabled;
    this.logDir = logDir;
    // ディレクトリ作成をコンストラクタで同期的に行い、並行書き込みの競合を回避
    if (enabled && !existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true, mode: 0o700 });
    }
  }

  logRequest(params: CreateMessageParams): void {
    if (!this.enabled) return;
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'request',
      data: {
        system: params.system.slice(0, 200) + (params.system.length > 200 ? '...' : ''),
        messageCount: params.messages.length,
        toolCount: params.tools.length,
        maxTokens: params.maxTokens,
      },
    };
    this.writeLog(entry);
  }

  logResponse(response: LLMResponse): void {
    if (!this.enabled) return;
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'response',
      data: {
        stopReason: response.stop_reason,
        contentBlockCount: response.content.length,
        contentTypes: response.content.map((b) => b.type),
      },
    };
    this.writeLog(entry);
  }

  private writeLog(entry: Record<string, unknown>): void {
    const logPath = join(this.logDir, getLogFileName());
    const line = maskSensitive(JSON.stringify(entry)) + '\n';

    // 非同期書き込み（fire-and-forget）
    appendFile(logPath, line, 'utf-8').catch(() => {
      // ログ書き込み失敗はメインフローに影響させない
    });
  }
}
