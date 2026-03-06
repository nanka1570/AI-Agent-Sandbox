import { createInterface } from 'node:readline/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { AgentLoop } from '../agent/agent-loop.js';
import { SystemPromptManager } from '../agent/system-prompt.js';
import { createToolDispatcher } from '../agent/setup.js';
import { CommandLoader } from '../loaders/command-loader.js';
import { confirm } from './confirm.js';
import {
  displayWelcome,
  displayError,
  displayToken,
  displayToolCall,
  displayNewline,
  displayHelp,
} from './display.js';
import type { Provider, ConversationContext } from '../types/index.js';
import { AuthenticationError } from '../types/index.js';

export interface ReplOptions {
  resumeId?: string;
  listConversations?: boolean;
  debug?: boolean;
}

export class Repl {
  private provider: Provider;
  private options: ReplOptions;
  private context!: ConversationContext;
  private agentLoop!: AgentLoop;
  private promptManager!: SystemPromptManager;
  private commandLoader: CommandLoader | null = null;
  private commandsLoaded = false;
  private abortController: AbortController | null = null;

  constructor(provider: Provider, options: ReplOptions = {}) {
    this.provider = provider;
    this.options = options;
  }

  async start(): Promise<void> {
    const dispatcher = createToolDispatcher({
      onConfirm: confirm,
      provider: this.provider,
    });

    this.commandLoader = new CommandLoader();

    this.promptManager = new SystemPromptManager();
    const systemPrompt = this.promptManager.build();

    this.context = {
      messages: [],
      systemPrompt,
      tools: [],
    };

    this.agentLoop = new AgentLoop({
      provider: this.provider,
      dispatcher,
      onToken: displayToken,
      onToolCall: displayToolCall,
    });

    displayWelcome();

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.on('close', () => {
      console.log('\nさようなら!');
    });

    // Ctrl+C で実行中のエージェントを中断する
    rl.on('SIGINT', () => {
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
        displayNewline();
      }
    });

    while (true) {
      let input: string;
      try {
        input = await rl.question('> ');
      } catch {
        break;
      }

      const trimmed = input.trim();
      if (!trimmed) continue;
      if (trimmed === 'exit' || trimmed === 'quit') {
        console.log('さようなら!');
        rl.close();
        break;
      }

      await this.handleInput(trimmed);
      displayNewline();
    }
  }

  /** コマンド定義の遅延読み込みを共通化 */
  private async ensureCommandsLoaded(): Promise<void> {
    if (this.commandLoader && !this.commandsLoaded) {
      await this.commandLoader.loadCommands([
        join(homedir(), '.claude', 'commands'),
        '.commands',
      ]);
      this.commandsLoaded = true;
    }
  }

  /** 入力文字列をコマンドまたはエージェント入力に振り分ける */
  private async handleInput(input: string): Promise<void> {
    const parsed = this.parseCommand(input);
    if (parsed) {
      await this.handleCommand(parsed.commandName, parsed.args);
    } else {
      await this.runAgent(input);
    }
  }

  /** スラッシュコマンドをパースする。コマンドでなければ null を返す */
  private parseCommand(input: string): { commandName: string; args: string } | null {
    if (!input.startsWith('/')) return null;

    const spaceIndex = input.indexOf(' ');
    const commandName = spaceIndex === -1
      ? input.slice(1)
      : input.slice(1, spaceIndex);
    const args = spaceIndex === -1 ? '' : input.slice(spaceIndex + 1).trim();

    return { commandName, args };
  }

  /** コマンドを解決・実行する */
  private async handleCommand(commandName: string, args: string): Promise<void> {
    if (commandName === 'help') {
      await this.ensureCommandsLoaded();
      await this.handleHelp();
      return;
    }

    await this.ensureCommandsLoaded();

    // コマンドローダーで解決を試みる
    if (this.commandLoader) {
      const command = this.commandLoader.resolve(commandName);
      if (command) {
        this.context.systemPrompt = this.promptManager.build({ command });
        const userMessage = args || `/${commandName} を実行してください`;
        await this.runAgent(userMessage);
        return;
      }
    }

    displayError(`コマンド '${commandName}' が見つかりません。/help で一覧を確認してください`);
  }

  private async handleHelp(): Promise<void> {
    const commands = this.commandLoader
      ? this.commandLoader.listCommands().map((c) => ({ name: c.name, description: c.description }))
      : [];
    displayHelp(commands);
  }

  private async runAgent(input: string): Promise<void> {
    try {
      this.abortController = new AbortController();
      await this.agentLoop.run(input, this.context, this.abortController.signal);
    } catch (error) {
      if (error instanceof Error) {
        displayError(error.message);
        // 認証エラーは回復不能なため即終了
        if (error instanceof AuthenticationError) {
          process.exit(1);
        }
      } else {
        displayError(String(error));
      }
    } finally {
      this.abortController = null;
    }
  }
}
