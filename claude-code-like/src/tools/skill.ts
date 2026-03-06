import { SkillLoader } from '../loaders/skill-loader.js';
import type { ToolDefinition, ToolResult } from '../types/index.js';

/**
 * スキルを読み込み、ガイドとテンプレートをコンテキストに注入するツール
 */
export function createSkillTool(options?: {
  skillLoader?: SkillLoader;
  skillDirs?: string[];
}): ToolDefinition {
  const loader = options?.skillLoader ?? new SkillLoader();
  const dirs = options?.skillDirs ?? ['.skills'];

  return {
    name: 'Skill',
    description: 'スキルを読み込み、ガイドとテンプレートをコンテキストに注入します。',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'スキル名' },
      },
      required: ['name'],
    },
    handler: async (input): Promise<ToolResult> => {
      const skillName = input.name as string;

      // SkillLoader 内部の loaded フラグで冪等性が保証される
      await loader.loadSkills(dirs);

      const skill = loader.resolve(skillName);
      if (!skill) {
        const available = loader.listSkills().map((s) => s.name).join(', ');
        return {
          content: `スキル '${skillName}' が見つかりません${available ? `。利用可能: ${available}` : ''}`,
          is_error: true,
        };
      }

      const parts: string[] = [skill.guide];
      if (skill.template) {
        parts.push(`\n\n## テンプレート\n\n${skill.template}`);
      }
      for (const [fileName, fileContent] of skill.additionalFiles) {
        parts.push(`\n\n## ${fileName}\n\n${fileContent}`);
      }

      return { content: parts.join('') };
    },
  };
}
