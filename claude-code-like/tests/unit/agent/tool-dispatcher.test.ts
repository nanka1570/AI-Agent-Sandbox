import { describe, it, expect, vi } from 'vitest';
import { ToolDispatcher } from '../../../src/agent/tool-dispatcher.js';
import type { ToolDefinition } from '../../../src/types/index.js';

function makeEchoTool(overrides?: Partial<ToolDefinition>): ToolDefinition {
  return {
    name: 'echo',
    description: 'テスト用エコーツール',
    input_schema: { type: 'object', properties: { message: { type: 'string' } } },
    handler: async (input) => ({ content: String(input.message ?? '') }),
    ...overrides,
  };
}

describe('ToolDispatcher', () => {
  it('ツールを登録して dispatch できる', async () => {
    const dispatcher = new ToolDispatcher();
    dispatcher.register(makeEchoTool());

    const result = await dispatcher.dispatch('echo', { message: 'hello' });

    expect(result.is_error).toBeFalsy();
    expect(result.content).toBe('hello');
  });

  it('未登録ツール名の場合 is_error: true を返す', async () => {
    const dispatcher = new ToolDispatcher();

    const result = await dispatcher.dispatch('unknown_tool', {});

    expect(result.is_error).toBe(true);
    expect(result.content).toContain('unknown_tool');
  });

  it('requiresConfirmation: true で確認承認時にツールを実行する', async () => {
    const onConfirm = vi.fn().mockResolvedValue(true);
    const dispatcher = new ToolDispatcher({ onConfirm });
    dispatcher.register(makeEchoTool({ requiresConfirmation: true }));

    const result = await dispatcher.dispatch('echo', { message: 'confirmed' });

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(result.is_error).toBeFalsy();
    expect(result.content).toBe('confirmed');
  });

  it('requiresConfirmation: true で確認拒否時に is_error を返す', async () => {
    const onConfirm = vi.fn().mockResolvedValue(false);
    const dispatcher = new ToolDispatcher({ onConfirm });
    dispatcher.register(makeEchoTool({ requiresConfirmation: true }));

    const result = await dispatcher.dispatch('echo', { message: 'should not run' });

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(result.is_error).toBe(true);
  });

  it('getToolSchemas() が正しいスキーマを返す', () => {
    const dispatcher = new ToolDispatcher();
    const tool = makeEchoTool();
    dispatcher.register(tool);

    const schemas = dispatcher.getToolSchemas();

    expect(schemas).toHaveLength(1);
    expect(schemas[0]).toEqual({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    });
  });

  it('getToolNames() が登録済みツール名を返す', () => {
    const dispatcher = new ToolDispatcher();
    dispatcher.register(makeEchoTool({ name: 'toolA' }));
    dispatcher.register(makeEchoTool({ name: 'toolB' }));

    const names = dispatcher.getToolNames();

    expect(names).toContain('toolA');
    expect(names).toContain('toolB');
    expect(names).toHaveLength(2);
  });

  it('handler が例外を投げた場合 is_error で返す', async () => {
    const dispatcher = new ToolDispatcher();
    dispatcher.register(
      makeEchoTool({
        handler: async () => {
          throw new Error('handler failure');
        },
      }),
    );

    const result = await dispatcher.dispatch('echo', {});

    expect(result.is_error).toBe(true);
    expect(result.content).toContain('handler failure');
  });
});
