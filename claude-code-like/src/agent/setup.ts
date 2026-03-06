import { ToolDispatcher } from './tool-dispatcher.js';
import { registerAllTools } from '../tools/index.js';
import type { Provider } from '../types/index.js';

export interface SetupOptions {
  onConfirm?: (message: string) => Promise<boolean>;
  provider?: Provider;
  timeout?: number;
  skillDirs?: string[];
  agentDirs?: string[];
}

/**
 * ToolDispatcher の初期化と全ツールの登録をまとめて行うファクトリー関数。
 * Repl が ToolDispatcher と registerAllTools の両方に依存しなくて済むよう集約。
 */
export function createToolDispatcher(options?: SetupOptions): ToolDispatcher {
  const dispatcher = new ToolDispatcher({
    onConfirm: options?.onConfirm,
  });
  registerAllTools(dispatcher, {
    onConfirm: options?.onConfirm,
    provider: options?.provider,
    timeout: options?.timeout,
    skillDirs: options?.skillDirs,
    agentDirs: options?.agentDirs,
  });
  return dispatcher;
}
