import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ConversationStore } from '../../src/agent/conversation-store.js';
import type { ConversationRecord } from '../../src/types/index.js';

describe('ConversationStore', () => {
  const testDir = join(tmpdir(), 'claude-code-like-conv-test');
  let store: ConversationStore;

  const createRecord = (overrides: Partial<ConversationRecord> = {}): ConversationRecord => ({
    id: ConversationStore.generateId(),
    summary: 'テスト会話',
    messages: [{ role: 'user', content: 'こんにちは' }],
    createdAt: '2026-03-07T10:00:00.000Z',
    updatedAt: '2026-03-07T10:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    store = new ConversationStore(testDir);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('save と loadById で会話を保存・復元できる', async () => {
    const record = createRecord();
    await store.save(record);

    const loaded = await store.loadById(record.id);
    expect(loaded).not.toBeNull();
    expect(loaded!.id).toBe(record.id);
    expect(loaded!.summary).toBe('テスト会話');
    expect(loaded!.messages).toHaveLength(1);
  });

  it('存在しない ID の場合は null を返す', async () => {
    const loaded = await store.loadById('nonexistent-id');
    expect(loaded).toBeNull();
  });

  it('loadLatest は最新の会話を返す', async () => {
    const old = createRecord({
      id: 'old-id',
      summary: '古い会話',
      updatedAt: '2026-03-06T10:00:00.000Z',
    });
    const recent = createRecord({
      id: 'recent-id',
      summary: '新しい会話',
      updatedAt: '2026-03-07T12:00:00.000Z',
    });

    await store.save(old);
    await store.save(recent);

    const latest = await store.loadLatest();
    expect(latest).not.toBeNull();
    expect(latest!.id).toBe('recent-id');
  });

  it('会話がない場合 loadLatest は null を返す', async () => {
    const latest = await store.loadLatest();
    expect(latest).toBeNull();
  });

  it('list はメタデータのみ updatedAt 降順で返す', async () => {
    await store.save(createRecord({
      id: 'a',
      summary: '会話A',
      updatedAt: '2026-03-07T08:00:00.000Z',
    }));
    await store.save(createRecord({
      id: 'b',
      summary: '会話B',
      updatedAt: '2026-03-07T12:00:00.000Z',
    }));
    await store.save(createRecord({
      id: 'c',
      summary: '会話C',
      updatedAt: '2026-03-07T10:00:00.000Z',
    }));

    const items = await store.list();
    expect(items).toHaveLength(3);
    expect(items[0]!.id).toBe('b');
    expect(items[1]!.id).toBe('c');
    expect(items[2]!.id).toBe('a');
    // messages フィールドが含まれないことを確認
    expect('messages' in items[0]!).toBe(false);
  });

  it('ディレクトリが存在しない場合は自動作成する', async () => {
    const deepDir = join(testDir, 'nested', 'deep');
    const deepStore = new ConversationStore(deepDir);
    const record = createRecord();
    await deepStore.save(record);

    const loaded = await deepStore.loadById(record.id);
    expect(loaded).not.toBeNull();
  });
});
