import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { DEFAULT_CONFIG } from './types/index.js';
import type { AppConfig, ProviderName } from './types/index.js';

const CONFIG_PATH = join(homedir(), '.claude-code-like', 'config.json');

const VALID_PROVIDERS: ProviderName[] = ['anthropic', 'gemini', 'groq', 'openrouter'];
const VALID_THEMES = ['default', 'dark', 'light'] as const;

export function loadConfig(configPath: string = CONFIG_PATH): AppConfig {
  let raw: string;
  try {
    raw = readFileSync(configPath, 'utf-8');
  } catch {
    // ファイル不在時はデフォルト値を返却（正常動作）
    return { ...DEFAULT_CONFIG };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    process.stderr.write('警告: config.json のパースに失敗しました。デフォルト設定を使用します\n');
    return { ...DEFAULT_CONFIG };
  }

  const config: AppConfig = { ...DEFAULT_CONFIG };

  if (typeof parsed['model'] === 'string') {
    config.model = parsed['model'];
  }

  if (typeof parsed['maxTokens'] === 'number' && parsed['maxTokens'] > 0) {
    config.maxTokens = parsed['maxTokens'];
  }

  if (typeof parsed['timeout'] === 'number' && parsed['timeout'] > 0) {
    config.timeout = parsed['timeout'];
  }

  if (typeof parsed['theme'] === 'string' && (VALID_THEMES as readonly string[]).includes(parsed['theme'])) {
    config.theme = parsed['theme'] as AppConfig['theme'];
  }

  if (typeof parsed['provider'] === 'string' && (VALID_PROVIDERS as string[]).includes(parsed['provider'])) {
    config.provider = parsed['provider'] as ProviderName;
  }

  return config;
}
