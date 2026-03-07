import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import type { ConversationRecord } from '../types/index.js';

const DEFAULT_BASE_DIR = join(homedir(), '.claude-code-like', 'conversations');

export class ConversationStore {
  private baseDir: string;

  constructor(baseDir: string = DEFAULT_BASE_DIR) {
    this.baseDir = baseDir;
  }

  private ensureDir(): void {
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true, mode: 0o700 });
    }
  }

  async save(record: ConversationRecord): Promise<void> {
    this.saveSync(record);
  }

  /** シグナルハンドラ等、同期的に保存が必要な場合に使用 */
  saveSync(record: ConversationRecord): void {
    this.ensureDir();
    const filePath = join(this.baseDir, `${record.id}.json`);
    writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8');
  }

  async loadById(id: string): Promise<ConversationRecord | null> {
    const filePath = join(this.baseDir, `${id}.json`);
    try {
      const raw = readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as ConversationRecord;
    } catch {
      return null;
    }
  }

  async loadLatest(): Promise<ConversationRecord | null> {
    const items = await this.list();
    if (items.length === 0) return null;
    // list() は updatedAt 降順なので先頭が最新
    const latest = items[0];
    if (!latest) return null;
    return this.loadById(latest.id);
  }

  async list(): Promise<Pick<ConversationRecord, 'id' | 'summary' | 'createdAt' | 'updatedAt'>[]> {
    this.ensureDir();
    const files = readdirSync(this.baseDir).filter((f) => f.endsWith('.json'));
    const records: Pick<ConversationRecord, 'id' | 'summary' | 'createdAt' | 'updatedAt'>[] = [];

    for (const file of files) {
      try {
        const raw = readFileSync(join(this.baseDir, file), 'utf-8');
        const record = JSON.parse(raw) as ConversationRecord;
        records.push({
          id: record.id,
          summary: record.summary,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        });
      } catch {
        // 壊れたファイルはスキップ
      }
    }

    // updatedAt 降順でソート
    records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return records;
  }

  static generateId(): string {
    return randomUUID();
  }
}
