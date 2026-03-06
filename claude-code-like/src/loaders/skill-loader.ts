import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseFrontmatter } from './frontmatter.js';
import type { SkillDefinition } from '../types/index.js';

/**
 * スキル定義ディレクトリを読み込み、スキルを管理するローダー
 * 各スキルは SKILL.md をメインファイルとして持つディレクトリ
 */
export class SkillLoader {
  private skills = new Map<string, SkillDefinition>();
  private loaded = false;

  async loadSkills(dirs: string[]): Promise<void> {
    if (this.loaded) return;

    for (const dir of dirs) {
      if (!existsSync(dir)) continue;

      const entries = readdirSync(dir);
      for (const entry of entries) {
        const skillDir = join(dir, entry);
        try {
          if (!statSync(skillDir).isDirectory()) continue;

          const skillMdPath = join(skillDir, 'SKILL.md');
          if (!existsSync(skillMdPath)) continue;

          const content = readFileSync(skillMdPath, 'utf-8');
          const { attributes, body } = parseFrontmatter(content);

          // テンプレートファイルの読み込み
          let template: string | undefined;
          const templatePath = join(skillDir, 'template.md');
          if (existsSync(templatePath)) {
            template = readFileSync(templatePath, 'utf-8');
          }

          // 追加ファイルの読み込み（SKILL.md と template.md 以外）
          const additionalFiles = new Map<string, string>();
          const allFiles = readdirSync(skillDir);
          for (const file of allFiles) {
            if (file === 'SKILL.md' || file === 'template.md') continue;
            const filePath = join(skillDir, file);
            try {
              if (statSync(filePath).isFile()) {
                const buf = readFileSync(filePath);
                // バイナリファイルはスキップ（null バイト判定）
                if (buf.includes(0)) continue;
                additionalFiles.set(file, buf.toString('utf-8'));
              }
            } catch (error) {
              console.warn(`スキル追加ファイルの読み込みに失敗: ${filePath}: ${(error as Error).message}`);
            }
          }

          const skill: SkillDefinition = {
            name: (attributes.name as string) ?? entry,
            description: (attributes.description as string) ?? '',
            guide: body,
            template,
            additionalFiles,
            dirPath: skillDir,
          };

          this.skills.set(skill.name, skill);
        } catch (error) {
          console.warn(`スキルディレクトリの読み込みに失敗: ${skillDir}: ${(error as Error).message}`);
        }
      }
    }

    this.loaded = true;
  }

  /** スキル名で解決する */
  resolve(name: string): SkillDefinition | null {
    return this.skills.get(name) ?? null;
  }

  /** 登録済みスキル一覧を返す */
  listSkills(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }
}
