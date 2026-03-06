export interface CommandDefinition {
  name: string;
  description: string;
  allowedTools?: string[];
  body: string;
  filePath: string;
}
