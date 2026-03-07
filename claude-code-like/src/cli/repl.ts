import { createInterface } from 'node:readline/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import chalk from 'chalk';
import { AgentLoop } from '../agent/agent-loop.js';
import { SystemPromptManager } from '../agent/system-prompt.js';
import { createToolDispatcher } from '../agent/setup.js';
import { CommandLoader } from '../loaders/command-loader.js';
import { ConversationStore } from '../agent/conversation-store.js';
import {
  displayError,
  displayToken,
  displayToolCall,
  displayNewline,
  displayHelp,
  startSpinner,
} from './display.js';
import type { Provider, ConversationContext, ConversationRecord } from '../types/index.js';
import { AuthenticationError } from '../types/index.js';
import type { DebugLogger } from '../debug-logger.js';

export interface ReplOptions {
  resumeId?: string;
  listConversations?: boolean;
  debug?: boolean;
  debugLogger?: DebugLogger;
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
  private conversationStore = new ConversationStore();
  private conversationRecord!: ConversationRecord;

  constructor(provider: Provider, options: ReplOptions = {}) {
    this.provider = provider;
    this.options = options;
  }

  async start(): Promise<void> {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // REPL の readline インスタンスを再利用して確認プロンプトを表示する。
    // 別の readline を作ると process.stdin の競合でクラッシュするため。
    const onConfirm = async (message: string): Promise<boolean> => {
      const answer = await rl.question(chalk.yellow(`${message}\n実行しますか? (y/n): `));
      return answer.trim().toLowerCase() === 'y';
    };

    const dispatcher = createToolDispatcher({
      onConfirm,
      provider: this.provider,
    });

    this.commandLoader = new CommandLoader();

    this.promptManager = new SystemPromptManager();
    const systemPrompt = this.promptManager.build();

    // 会話の復元 or 新規作成
    if (this.options.resumeId) {
      const record = await this.conversationStore.loadById(this.options.resumeId);
      if (record) {
        this.conversationRecord = record;
        console.log(chalk.gray(`会話を復元しました: ${record.summary}`));
      } else {
        displayError(`会話ID '${this.options.resumeId}' が見つかりません`);
        this.conversationRecord = this.createNewRecord();
      }
    } else {
      this.conversationRecord = this.createNewRecord();
    }

    this.context = {
      messages: this.conversationRecord.messages,
      systemPrompt,
      tools: [],
    };

    this.agentLoop = new AgentLoop({
      provider: this.provider,
      dispatcher,
      onToken: displayToken,
      onToolCall: displayToolCall,
      onThinking: startSpinner,
      debugLogger: this.options.debugLogger,
    });

    rl.on('close', () => {
      console.log('\nさようなら!');
    });

    // SIGINT/SIGTERM 時に会話を即時保存
    const saveAndExit = (): void => {
      this.saveConversationSync();
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
        displayNewline();
      }
    };

    rl.on('SIGINT', () => {
      saveAndExit();
    });

    process.on('SIGTERM', () => {
      this.saveConversationSync();
      process.exit(0);
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
      if (trimmed === '/exit' || trimmed === '/quit' || trimmed === 'exit' || trimmed === 'quit') {
        await this.saveConversation();
        console.log('さようなら!');
        rl.close();
        break;
      }

      await this.handleInput(trimmed);
      await this.saveConversation();
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

  private createNewRecord(): ConversationRecord {
    const now = new Date().toISOString();
    return {
      id: ConversationStore.generateId(),
      summary: '',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  /** 会話レコードの状態を最新に同期する */
  private syncConversationState(): void {
    this.conversationRecord.messages = this.context.messages;
    this.conversationRecord.updatedAt = new Date().toISOString();
    if (!this.conversationRecord.summary && this.context.messages.length > 0) {
      const first = this.context.messages[0];
      if (first && typeof first.content === 'string') {
        this.conversationRecord.summary = first.content.slice(0, 100);
      }
    }
  }

  private async saveConversation(): Promise<void> {
    this.syncConversationState();
    try {
      await this.conversationStore.save(this.conversationRecord);
    } catch {
      // 保存失敗は会話を継続
    }
  }

  /** SIGINT/SIGTERM ハンドラ用: 同期的に保存（process.exit 前に完了させるため） */
  private saveConversationSync(): void {
    this.syncConversationState();
    try {
      this.conversationStore.saveSync(this.conversationRecord);
    } catch {
      // 保存失敗は無視
    }
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
