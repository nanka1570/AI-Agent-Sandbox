import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig } from '../../src/config-loader.js';
import { DEFAULT_CONFIG } from '../../src/types/index.js';

describe('loadConfig', () => {
  const testDir = join(tmpdir(), 'claude-code-like-config-test');
  const configPath = join(testDir, 'config.json');

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('ファイルが存在しない場合はデフォルト値を返す', () => {
    const config = loadConfig(join(testDir, 'nonexistent.json'));
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it('正常な config を読み込む', () => {
    writeFileSync(configPath, JSON.stringify({
      model: 'claude-opus-4-20250514',
      maxTokens: 4096,
      timeout: 60,
      theme: 'dark',
      provider: 'anthropic',
    }));

    const config = loadConfig(configPath);
    expect(config.model).toBe('claude-opus-4-20250514');
    expect(config.maxTokens).toBe(4096);
    expect(config.timeout).toBe(60);
    expect(config.theme).toBe('dark');
    expect(config.provider).toBe('anthropic');
  });

  it('部分的な設定でも残りはデフォルト値を使う', () => {
    writeFileSync(configPath, JSON.stringify({
      model: 'my-model',
    }));

    const config = loadConfig(configPath);
    expect(config.model).toBe('my-model');
    expect(config.maxTokens).toBe(DEFAULT_CONFIG.maxTokens);
    expect(config.timeout).toBe(DEFAULT_CONFIG.timeout);
    expect(config.theme).toBe(DEFAULT_CONFIG.theme);
    expect(config.provider).toBeUndefined();
  });

  it('不正な JSON の場合はデフォルト値を返す', () => {
    writeFileSync(configPath, 'invalid json{{{');

    const warnSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const config = loadConfig(configPath);
    expect(config).toEqual(DEFAULT_CONFIG);
    warnSpy.mockRestore();
  });

  it('不正な provider 値は無視する', () => {
    writeFileSync(configPath, JSON.stringify({
      provider: 'invalid-provider',
    }));

    const config = loadConfig(configPath);
    expect(config.provider).toBeUndefined();
  });

  it('不正な theme 値は無視する', () => {
    writeFileSync(configPath, JSON.stringify({
      theme: 'neon',
    }));

    const config = loadConfig(configPath);
    expect(config.theme).toBe('default');
  });

  it('負の maxTokens は無視する', () => {
    writeFileSync(configPath, JSON.stringify({
      maxTokens: -100,
    }));

    const config = loadConfig(configPath);
    expect(config.maxTokens).toBe(DEFAULT_CONFIG.maxTokens);
  });
});
