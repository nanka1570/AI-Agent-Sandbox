import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DebugLogger } from '../../src/debug-logger.js';
import type { CreateMessageParams, LLMResponse } from '../../src/types/index.js';

describe('DebugLogger', () => {
  const testDir = join(tmpdir(), 'claude-code-like-debug-test');

  const mockParams: CreateMessageParams = {
    messages: [{ role: 'user', content: 'hello' }],
    system: 'You are a helpful assistant.',
    tools: [],
    maxTokens: 8192,
  };

  const mockResponse: LLMResponse = {
    content: [{ type: 'text', text: 'Hello!' }],
    stop_reason: 'end_turn',
  };

  beforeEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('enabled=false の場合はログを書き込まない', async () => {
    const logger = new DebugLogger(false, testDir);
    logger.logRequest(mockParams);
    logger.logResponse(mockResponse);
    // 少し待ってもディレクトリが作られない
    await new Promise((r) => setTimeout(r, 100));
    expect(existsSync(testDir)).toBe(false);
  });

  it('enabled=true の場合はログファイルを作成する', async () => {
    const logger = new DebugLogger(true, testDir);
    logger.logRequest(mockParams);
    logger.logResponse(mockResponse);
    // 非同期書き込みを待つ
    await new Promise((r) => setTimeout(r, 200));

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const logFile = join(testDir, `${yyyy}-${mm}-${dd}.jsonl`);

    expect(existsSync(logFile)).toBe(true);
    const content = readFileSync(logFile, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines.length).toBe(2);

    const requestLog = JSON.parse(lines[0]!);
    expect(requestLog.type).toBe('request');
    expect(requestLog.data.messageCount).toBe(1);

    const responseLog = JSON.parse(lines[1]!);
    expect(responseLog.type).toBe('response');
    expect(responseLog.data.stopReason).toBe('end_turn');
  });

  it('API キーをマスキングする', async () => {
    const logger = new DebugLogger(true, testDir);
    const paramsWithKey: CreateMessageParams = {
      ...mockParams,
      system: 'Key: sk-ant-abc123-secret Bearer token123.abc',
    };
    logger.logRequest(paramsWithKey);
    await new Promise((r) => setTimeout(r, 200));

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const logFile = join(testDir, `${yyyy}-${mm}-${dd}.jsonl`);

    const content = readFileSync(logFile, 'utf-8');
    expect(content).not.toContain('sk-ant-abc123-secret');
    expect(content).not.toContain('Bearer token123.abc');
    expect(content).toContain('***');
  });
});
