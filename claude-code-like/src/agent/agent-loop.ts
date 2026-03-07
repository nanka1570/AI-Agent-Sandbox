import type {
  Provider,
  ConversationContext,
  ToolUseBlock,
  ToolResultBlockParam,
} from '../types/index.js';
import { AuthenticationError, RateLimitError } from '../types/index.js';
import { ToolDispatcher } from './tool-dispatcher.js';
import { AGENT_DEFAULTS, TOOL_DEFAULTS } from '../constants.js';

export class AgentLoop {
  private provider: Provider;
  private dispatcher: ToolDispatcher;
  private maxTokens: number;
  private onToken?: (token: string) => void;
  private onToolCall?: (name: string, inputPreview: string) => void;

  constructor(options: {
    provider: Provider;
    dispatcher: ToolDispatcher;
    maxTokens?: number;
    onToken?: (token: string) => void;
    onToolCall?: (name: string, inputPreview: string) => void;
  }) {
    this.provider = options.provider;
    this.dispatcher = options.dispatcher;
    this.maxTokens = options.maxTokens ?? AGENT_DEFAULTS.MAX_TOKENS;
    this.onToken = options.onToken;
    this.onToolCall = options.onToolCall;
  }

  async run(
    userMessage: string,
    context: ConversationContext,
    signal?: AbortSignal,
  ): Promise<string> {
    context.messages.push({ role: 'user', content: userMessage });

    let finalText = '';
    let turnCount = 0;

    // Tool Use ループ: end_turn, max_tokens, または最大ターン数まで繰り返す
    while (turnCount < AGENT_DEFAULTS.MAX_TURNS) {
      // AbortSignal チェック
      if (signal?.aborted) {
        this.onToken?.('\n\n[中断されました]');
        break;
      }

      // messages 上限チェック: 超過時は先頭のメッセージペアを安全に削除
      while (context.messages.length > AGENT_DEFAULTS.MAX_MESSAGES) {
        // 先頭が user+assistant ペアの場合のみ削除（tool_result 等の不完全ペアは壊さない）
        if (
          context.messages.length >= 2 &&
          context.messages[0]?.role === 'user' &&
          context.messages[1]?.role === 'assistant'
        ) {
          context.messages.splice(0, 2);
        } else if (context.messages[0]?.role === 'user') {
          // user のみ（tool_result）の場合は1件削除
          context.messages.splice(0, 1);
        } else {
          // 安全に削除できない構造の場合はループを抜ける
          break;
        }
      }

      turnCount++;
      let response;
      try {
        response = await this.provider.createMessage({
          messages: context.messages,
          system: context.systemPrompt,
          tools: this.dispatcher.getToolSchemas(),
          maxTokens: this.maxTokens,
        });
      } catch (error) {
        if (error && typeof error === 'object') {
          const status = ('status' in error ? (error as { status: number }).status : null)
                      ?? ('statusCode' in error ? (error as { statusCode: number }).statusCode : null);
          if (status === 401) {
            throw new AuthenticationError(
              'API キーが無効です。API キーを確認してください',
            );
          }
          if (status === 429) {
            throw new RateLimitError(
              'API レート制限に達しました。しばらく待ってから再試行してください',
            );
          }
        }
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`API に接続できません: ${detail}`);
      }

      const contentBlocks = response.content;
      const stopReason = response.stop_reason;

      // テキストブロックを処理
      let turnText = '';
      const toolUseBlocks: ToolUseBlock[] = [];

      for (const block of contentBlocks) {
        if (block.type === 'text') {
          turnText += block.text;
          this.onToken?.(block.text);
        } else if (block.type === 'tool_use') {
          toolUseBlocks.push(block as ToolUseBlock);
        }
      }

      // assistant メッセージを追加
      context.messages.push({ role: 'assistant', content: contentBlocks });

      if (stopReason === 'end_turn' || stopReason === 'max_tokens') {
        finalText = turnText;
        if (stopReason === 'max_tokens') {
          this.onToken?.('\n\n[応答が最大トークン数に達しました。続きが必要な場合は入力してください]');
        }
        break;
      }

      // tool_use の場合: ツール実行 → 結果を messages に追加
      if (stopReason === 'tool_use') {
        // ツールブロックが空の場合は無限ループを防止して終了
        if (toolUseBlocks.length === 0) {
          finalText = turnText;
          break;
        }

        const toolResults: ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          this.onToolCall?.(
            toolUse.name,
            JSON.stringify(toolUse.input).slice(0, TOOL_DEFAULTS.TOOL_INPUT_PREVIEW_LENGTH),
          );
          const result = await this.dispatcher.dispatch(
            toolUse.name,
            toolUse.input as Record<string, unknown>,
          );
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result.content,
            is_error: result.is_error,
          });
        }

        context.messages.push({ role: 'user', content: toolResults });
      } else {
        // 未知の stop_reason: 無限ループ防止のためループを終了
        finalText = turnText;
        break;
      }
    }

    // 最大ターン数に達した場合の通知
    if (turnCount >= AGENT_DEFAULTS.MAX_TURNS) {
      this.onToken?.('\n\n[最大ターン数に達しました]');
    }

    return finalText;
  }
}
