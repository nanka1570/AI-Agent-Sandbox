import type { ToolDispatcher } from '../agent/tool-dispatcher.js';
import type { Provider } from '../types/index.js';
import { createReadTool } from './read.js';
import { createWriteTool } from './write.js';
import { createEditTool } from './edit.js';
import { createBashTool } from './bash.js';
import { createGlobTool } from './glob.js';
import { createGrepTool } from './grep.js';
import { createSkillTool } from './skill.js';
import { createSubAgentTool } from './sub-agent.js';

export interface RegisterToolsOptions {
  onConfirm?: (message: string) => Promise<boolean>;
  timeout?: number;
  provider?: Provider;
  skillDirs?: string[];
  agentDirs?: string[];
}

export function registerAllTools(
  dispatcher: ToolDispatcher,
  options?: RegisterToolsOptions,
): void {
  dispatcher.register(createReadTool());
  dispatcher.register(createWriteTool({ onConfirm: options?.onConfirm }));
  dispatcher.register(createEditTool());
  dispatcher.register(createBashTool({ timeout: options?.timeout }));
  dispatcher.register(createGlobTool());
  dispatcher.register(createGrepTool());
  dispatcher.register(createSkillTool({ skillDirs: options?.skillDirs }));

  if (options?.provider) {
    dispatcher.register(createSubAgentTool({
      provider: options.provider,
      agentDirs: options?.agentDirs,
    }));
  }
}
