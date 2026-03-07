/** アプリケーション全体で使用するマジックナンバーの一元管理 */

export const TOOL_DEFAULTS = {
  BASH_TIMEOUT_SECONDS: 120,
  BASH_MAX_BUFFER_BYTES: 10 * 1024 * 1024,
  READ_MAX_LINES: 2000,
  GREP_MAX_FILES: 500,
  GREP_MAX_RESULTS: 200,
  GREP_CONTEXT_LINES: 2,
  TOOL_INPUT_PREVIEW_LENGTH: 100,
} as const;

export const AGENT_DEFAULTS = {
  MAX_TOKENS: 8192,
  MAX_TURNS: 50,
  MAX_MESSAGES: 200,
} as const;
