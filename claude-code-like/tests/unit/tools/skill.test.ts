import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createSkillTool } from '../../../src/tools/skill.js';

describe('Skill ツール', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'skill-tool-test-'));
    const skillDir = join(tempDir, 'test-skill');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      '---\nname: test-skill\ndescription: テストスキル\n---\n# ガイド本文',
    );
    writeFileSync(join(skillDir, 'template.md'), 'テンプレート内容');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('スキルの内容を返す', async () => {
    const tool = createSkillTool({ skillDirs: [tempDir] });
    const result = await tool.handler({ name: 'test-skill' });
    expect(result.is_error).toBeUndefined();
    expect(result.content).toContain('ガイド本文');
    expect(result.content).toContain('テンプレート内容');
  });

  it('存在しないスキルの場合エラーを返す', async () => {
    const tool = createSkillTool({ skillDirs: [tempDir] });
    const result = await tool.handler({ name: 'nonexistent' });
    expect(result.is_error).toBe(true);
    expect(result.content).toContain('見つかりません');
  });
});
