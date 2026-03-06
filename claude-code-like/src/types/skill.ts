export interface SkillDefinition {
  name: string;
  description: string;
  guide: string;
  template?: string;
  additionalFiles: Map<string, string>;
  dirPath: string;
}
