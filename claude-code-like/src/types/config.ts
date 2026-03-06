import { AGENT_DEFAULTS, TOOL_DEFAULTS } from '../constants.js';

export interface AppConfig {
  model: string;
  maxTokens: number;
  timeout: number;
  theme: 'default' | 'dark' | 'light';
  provider?: 'anthropic';
}

export const DEFAULT_CONFIG: AppConfig = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: AGENT_DEFAULTS.MAX_TOKENS,
  timeout: TOOL_DEFAULTS.BASH_TIMEOUT_SECONDS,
  theme: 'default',
  provider: 'anthropic',
};
