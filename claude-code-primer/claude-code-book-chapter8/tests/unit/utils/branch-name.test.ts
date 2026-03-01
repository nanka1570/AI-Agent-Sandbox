import { describe, it, expect } from 'vitest';
import { generateBranchName } from '../../../src/utils/branch-name.js';

describe('generateBranchName', () => {
  it('英語タイトルから正しいブランチ名を生成する', () => {
    const result = generateBranchName(1, 'Add user authentication');
    expect(result).toBe('feature/task-1-add-user-authentication');
  });

  it('日本語のみのタイトルではslugなしのブランチ名を生成する', () => {
    const result = generateBranchName(2, 'ユーザー認証機能の実装');
    expect(result).toBe('feature/task-2');
  });

  it('英数字と日本語が混在するタイトルでは英数字部分のみ使用する', () => {
    const result = generateBranchName(3, 'Fix bug123 in login');
    expect(result).toBe('feature/task-3-fix-bug123-in-login');
  });

  it('特殊文字を除去してハイフンに変換する', () => {
    const result = generateBranchName(4, 'Add @user & profile!');
    expect(result).toBe('feature/task-4-add-user-profile');
  });

  it('連続するハイフンを1つにまとめる', () => {
    const result = generateBranchName(5, 'Add---multiple---hyphens');
    expect(result).toBe('feature/task-5-add-multiple-hyphens');
  });

  it('大文字を小文字に変換する', () => {
    const result = generateBranchName(6, 'MyFeature');
    expect(result).toBe('feature/task-6-myfeature');
  });

  it('50文字を超えるslugを切り詰める', () => {
    const longTitle = 'a'.repeat(100);
    const result = generateBranchName(7, longTitle);
    const slug = result.replace('feature/task-7-', '');
    expect(slug.length).toBeLessThanOrEqual(50);
  });

  it('先頭・末尾のハイフンを除去する', () => {
    const result = generateBranchName(8, '---hello---');
    expect(result).toBe('feature/task-8-hello');
  });

  it('空のタイトルではslugなしのブランチ名を生成する', () => {
    const result = generateBranchName(9, '');
    expect(result).toBe('feature/task-9');
  });
});
