import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SkillLoader } from '../../../src/loaders/skill-loader.js';

describe('SkillLoader', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'skill-test-'));
    const skillDir = join(tempDir, '.skills', 'code-review');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      '---\nname: code-review\ndescription: コードレビュースキル\n---\n# コードレビューガイド\n\nチェックリスト',
    );
    writeFileSync(join(skillDir, 'template.md'), '## テンプレート\n\nレビュー結果');
    writeFileSync(join(skillDir, 'checklist.md'), '- [ ] 項目1\n- [ ] 項目2');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('スキル定義を読み込む', async () => {
    const loader = new SkillLoader();
    await loader.loadSkills([join(tempDir, '.skills')]);
    const skills = loader.listSkills();
    expect(skills.length).toBe(1);
    expect(skills[0]?.name).toBe('code-review');
  });

  it('スキル名で解決する', async () => {
    const loader = new SkillLoader();
    await loader.loadSkills([join(tempDir, '.skills')]);
    const skill = loader.resolve('code-review');
    expect(skill).not.toBeNull();
    expect(skill?.guide).toContain('コードレビューガイド');
    expect(skill?.template).toContain('テンプレート');
    expect(skill?.additionalFiles.get('checklist.md')).toContain('項目1');
  });

  it('存在しないスキルは null を返す', async () => {
    const loader = new SkillLoader();
    await loader.loadSkills([join(tempDir, '.skills')]);
    expect(loader.resolve('nonexistent')).toBeNull();
  });
});
