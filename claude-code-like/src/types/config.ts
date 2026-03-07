import { AGENT_DEFAULTS, TOOL_DEFAULTS } from '../constants.js';

export type ProviderName = 'anthropic' | 'gemini' | 'groq' | 'openrouter';

export interface AppConfig {
  model: string;
  maxTokens: number;
  timeout: number;
  theme: 'default' | 'dark' | 'light';
  provider?: ProviderName;
}

export const DEFAULT_CONFIG: AppConfig = {
  model: '',
  maxTokens: AGENT_DEFAULTS.MAX_TOKENS,
  timeout: TOOL_DEFAULTS.BASH_TIMEOUT_SECONDS,
  theme: 'default',
  provider: undefined,
};
