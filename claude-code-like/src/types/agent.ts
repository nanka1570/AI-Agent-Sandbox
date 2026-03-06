export interface AgentDefinition {
  name: string;
  description: string;
  tools: string[];
  /** サブエージェント用モデル指定（MVP では未使用。sub-agent.ts で provider を切り替える実装が必要） */
  model?: string;
  instructions: string;
  filePath: string;
}
