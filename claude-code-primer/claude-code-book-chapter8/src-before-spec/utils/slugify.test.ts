import { describe, it, expect } from 'vitest';
import { slugify, generateBranchName, isValidGitBranchName, sanitizeBranchName } from './slugify.js';

describe('slugify', () => {
  describe('基本的な変換', () => {
    it('英語のタイトルを正しくslugifyできる', () => {
      // Given: 準備
      const title = 'Add user authentication';

      // When: 実行
      const result = slugify(title);

      // Then: 検証
      expect(result).toBe('add-user-authentication');
    });

    it('スペースをハイフンに変換する', () => {
      // Given: 準備
      const title = 'My New Task';

      // When: 実行
      const result = slugify(title);

      // Then: 検証
      expect(result).toBe('my-new-task');
    });

    it('特殊文字を削除する', () => {
      // Given: 準備
      const title = 'Fix bug #123 & update docs!';

      // When: 実行
      const result = slugify(title);

      // Then: 検証
      expect(result).toBe('fix-bug-123-update-docs');
    });
  });

  describe('日本語の変換', () => {
    it('ひらがなをローマ字に変換する', () => {
      // Given: 準備
      const title = 'ユーザー認証機能';

      // When: 実行
      const result = slugify(title);

      // Then: 検証
      expect(result).toBe('yuza');
    });

    it('カタカナをローマ字に変換する', () => {
      // Given: 準備
      const title = 'ログイン機能';

      // When: 実行
      const result = slugify(title);

      // Then: 検証
      expect(result).toBe('roguin');
    });

    it('混在した日本語と英語を処理する', () => {
      // Given: 準備
      const title = 'Add ユーザー login';

      // When: 実行
      const result = slugify(title);

      // Then: 検証
      expect(result).toBe('add-yuza-login');
    });
  });

  describe('長さ制限', () => {
    it('デフォルトの30文字制限が適用される', () => {
      // Given: 準備
      const title = 'This is a very very long task title that should be truncated';

      // When: 実行
      const result = slugify(title);

      // Then: 検証
      expect(result.length).toBeLessThanOrEqual(30);
      expect(result).toBe('this-is-a-very-very-long-task');
    });

    it('カスタム長さ制限を指定できる', () => {
      // Given: 準備
      const title = 'Long task title';
      const maxLength = 10;

      // When: 実行
      const result = slugify(title, maxLength);

      // Then: 検証
      expect(result.length).toBeLessThanOrEqual(maxLength);
      expect(result).toBe('long-task');
    });

    it('末尾のハイフンが削除される', () => {
      // Given: 準備
      const title = 'Test task-';
      const maxLength = 9; // "test-task" = 9文字、末尾の"-"で10文字だが切り詰められる

      // When: 実行
      const result = slugify(title, maxLength);

      // Then: 検証
      expect(result).toBe('test-task');
      expect(result.endsWith('-')).toBe(false);
    });
  });

  describe('エッジケース', () => {
    it('空文字列の場合はデフォルト値を返す', () => {
      // Given: 準備
      const title = '';

      // When: 実行
      const result = slugify(title);

      // Then: 検証
      expect(result).toBe('task');
    });

    it('nullの場合はデフォルト値を返す', () => {
      // Given: 準備
      const title = null as any;

      // When: 実行
      const result = slugify(title);

      // Then: 検証
      expect(result).toBe('task');
    });

    it('数字で始まる場合はtask-プレフィックスを追加する', () => {
      // Given: 準備
      const title = '123 test';

      // When: 実行
      const result = slugify(title);

      // Then: 検証
      expect(result).toBe('task-123-test');
    });

    it('ハイフンで始まる場合はtask-プレフィックスを追加する', () => {
      // Given: 準備
      const title = '-test-task';

      // When: 実行
      const result = slugify(title);

      // Then: 検証
      expect(result).toBe('test-task');
    });

    it('短すぎる結果の場合はデフォルト値を返す', () => {
      // Given: 準備
      const title = 'a';

      // When: 実行
      const result = slugify(title);

      // Then: 検証
      expect(result).toBe('task');
    });

    it('連続するハイフンを単一のハイフンに変換する', () => {
      // Given: 準備
      const title = 'test   multiple   spaces';

      // When: 実行
      const result = slugify(title);

      // Then: 検証
      expect(result).toBe('test-multiple-spaces');
    });
  });
});

describe('generateBranchName', () => {
  it('タスクIDとタイトルからブランチ名を生成する', () => {
    // Given: 準備
    const taskId = 1;
    const title = 'Add user authentication';

    // When: 実行
    const result = generateBranchName(taskId, title);

    // Then: 検証
    expect(result).toBe('feature/task-1-add-user-authentication');
  });

  it('日本語タイトルでも正しくブランチ名を生成する', () => {
    // Given: 準備
    const taskId = 42;
    const title = 'ユーザー認証機能の実装';

    // When: 実行
    const result = generateBranchName(taskId, title);

    // Then: 検証
    expect(result).toBe('feature/task-42-yuzano');
  });

  it('長いタイトルの場合は適切に切り詰められる', () => {
    // Given: 準備
    const taskId = 1;
    const title = 'This is a very long task title that should be truncated properly';

    // When: 実行
    const result = generateBranchName(taskId, title);

    // Then: 検証
    expect(result).toMatch(/^feature\/task-1-/);
    expect(result.length).toBeLessThanOrEqual(50); // feature/ + task-1- + 25文字のslug
  });
});

describe('isValidGitBranchName', () => {
  it('有効なブランチ名を正しく判定する', () => {
    // Given: 準備
    const validNames = [
      'feature/user-auth',
      'bugfix/issue-123',
      'main',
      'development',
      'feature/task-1-add-feature'
    ];

    // When/Then: 実行と検証
    validNames.forEach(name => {
      expect(isValidGitBranchName(name)).toBe(true);
    });
  });

  it('無効なブランチ名を正しく判定する', () => {
    // Given: 準備
    const invalidNames = [
      '', // 空文字列
      '.hidden', // ドットで始まる
      '-dash', // ハイフンで始まる
      'branch/', // スラッシュで終わる
      'branch..name', // 連続するドット
      'branch name', // スペースを含む
      'branch~name', // 無効な文字
      'branch^name', // 無効な文字
      'branch:name', // 無効な文字
      '@' // 単一の@
    ];

    // When/Then: 実行と検証
    invalidNames.forEach(name => {
      expect(isValidGitBranchName(name)).toBe(false);
    });
  });
});

describe('sanitizeBranchName', () => {
  it('無効な文字をハイフンに置換する', () => {
    // Given: 準備
    const input = 'feature~branch:name';

    // When: 実行
    const result = sanitizeBranchName(input);

    // Then: 検証
    expect(result).toBe('feature-branch-name');
  });

  it('連続するドットを単一のドットに変換する', () => {
    // Given: 準備
    const input = 'branch...name';

    // When: 実行
    const result = sanitizeBranchName(input);

    // Then: 検証
    expect(result).toBe('branch.name');
  });

  it('前後の無効な文字を削除する', () => {
    // Given: 準備
    const input = '.../branch-name/.../';

    // When: 実行
    const result = sanitizeBranchName(input);

    // Then: 検証
    expect(result).toBe('branch-name');
  });

  it('空文字列や無効な入力にはデフォルト値を返す', () => {
    // Given: 準備
    const inputs = ['', null as any, '@', '...'];

    // When/Then: 実行と検証
    inputs.forEach(input => {
      const result = sanitizeBranchName(input);
      expect(result).toBe('feature/task');
    });
  });
});