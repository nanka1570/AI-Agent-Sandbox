export interface ToolResult {
  content: string;
  is_error?: boolean;
}

export interface InputSchema {
  type: 'object';
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: InputSchema;
  handler: (input: Record<string, unknown>) => Promise<ToolResult>;
  requiresConfirmation?: boolean;
}

export interface ToolSchema {
  name: string;
  description: string;
  input_schema: InputSchema;
}
