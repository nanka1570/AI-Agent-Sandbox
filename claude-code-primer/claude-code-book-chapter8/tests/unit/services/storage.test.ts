import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Storage } from '../../../src/services/storage.js';

describe('Storage', () => {
  let tmpDir: string;
  let storage: Storage;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'taskcli-test-'));
    storage = new Storage(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('load', () => {
    it('ファイルが存在しない場合は初期データを返す', () => {
      const store = storage.load();
      expect(store).toEqual({
        version: 1,
        nextId: 1,
        tasks: [],
      });
    });

    it('既存のファイルからデータを読み込む', () => {
      const data = {
        version: 1,
        nextId: 3,
        tasks: [
          {
            id: 1,
            title: 'テストタスク',
            status: 'open',
            priority: 'medium',
            dueDate: null,
            branch: null,
            createdAt: '2026-03-01T00:00:00.000Z',
            updatedAt: '2026-03-01T00:00:00.000Z',
            completedAt: null,
          },
        ],
      };
      const dirPath = path.join(tmpDir, '.taskcli');
      fs.mkdirSync(dirPath, { recursive: true });
      fs.writeFileSync(
        path.join(dirPath, 'tasks.json'),
        JSON.stringify(data, null, 2)
      );

      const store = storage.load();
      expect(store.nextId).toBe(3);
      expect(store.tasks).toHaveLength(1);
      expect(store.tasks[0].title).toBe('テストタスク');
    });

    it('破損したJSONファイルの場合はエラーをスローする', () => {
      const dirPath = path.join(tmpDir, '.taskcli');
      fs.mkdirSync(dirPath, { recursive: true });
      fs.writeFileSync(
        path.join(dirPath, 'tasks.json'),
        'invalid json {'
      );

      expect(() => storage.load()).toThrow(
        'データファイルが破損しています'
      );
    });
  });

  describe('save', () => {
    it('データをJSONファイルに保存する', () => {
      const store = {
        version: 1 as const,
        nextId: 2,
        tasks: [
          {
            id: 1,
            title: 'テストタスク',
            status: 'open' as const,
            priority: 'medium' as const,
            dueDate: null,
            branch: null,
            createdAt: '2026-03-01T00:00:00.000Z',
            updatedAt: '2026-03-01T00:00:00.000Z',
            completedAt: null,
          },
        ],
      };
      storage.save(store);

      const filePath = path.join(tmpDir, '.taskcli', 'tasks.json');
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.nextId).toBe(2);
      expect(parsed.tasks[0].title).toBe('テストタスク');
    });

    it('ディレクトリが存在しない場合は自動作成する', () => {
      const dirPath = path.join(tmpDir, '.taskcli');
      expect(fs.existsSync(dirPath)).toBe(false);

      storage.save({ version: 1, nextId: 1, tasks: [] });

      expect(fs.existsSync(dirPath)).toBe(true);
    });

    it('インデント付きで保存する', () => {
      storage.save({ version: 1, nextId: 1, tasks: [] });

      const filePath = path.join(tmpDir, '.taskcli', 'tasks.json');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('  ');
    });
  });

  describe('exists', () => {
    it('ディレクトリが存在しない場合はfalseを返す', () => {
      expect(storage.exists()).toBe(false);
    });

    it('ディレクトリが存在する場合はtrueを返す', () => {
      fs.mkdirSync(path.join(tmpDir, '.taskcli'), { recursive: true });
      expect(storage.exists()).toBe(true);
    });
  });

  describe('initialize', () => {
    it('ディレクトリを作成する', () => {
      storage.initialize();
      expect(
        fs.existsSync(path.join(tmpDir, '.taskcli'))
      ).toBe(true);
    });

    it('既にディレクトリが存在する場合はエラーにならない', () => {
      fs.mkdirSync(path.join(tmpDir, '.taskcli'), { recursive: true });
      expect(() => storage.initialize()).not.toThrow();
    });
  });
});
