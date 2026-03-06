import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../../../src/loaders/frontmatter.js';

describe('Frontmatter パーサー', () => {
  it('YAML frontmatter を解析する', () => {
    const content = '---\ndescription: テスト\nallowed-tools: Read, Write\n---\n# 本文\n\nここが body';
    const result = parseFrontmatter(content);
    expect(result.attributes.description).toBe('テスト');
    expect(result.attributes['allowed-tools']).toBe('Read, Write');
    expect(result.body).toContain('# 本文');
  });

  it('frontmatter がない場合は全体を body として返す', () => {
    const content = '# ただの Markdown\n\n本文です';
    const result = parseFrontmatter(content);
    expect(result.attributes).toEqual({});
    expect(result.body).toBe(content);
  });

  it('空の frontmatter を処理する', () => {
    const content = '---\n---\n本文のみ';
    const result = parseFrontmatter(content);
    expect(result.attributes).toEqual({});
    expect(result.body).toBe('本文のみ');
  });
});
