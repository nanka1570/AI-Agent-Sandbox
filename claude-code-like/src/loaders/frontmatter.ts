import { parse as parseYaml } from 'yaml';

export interface FrontmatterResult {
  attributes: Record<string, unknown>;
  body: string;
}

/**
 * YAML frontmatter を解析する共通パーサー
 * `---` で囲まれた部分を YAML パースし、残りを body として返す
 */
export function parseFrontmatter(content: string): FrontmatterResult {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  // 空の frontmatter (---\n---) にも対応
  const emptyMatch = !match ? content.match(/^---\r?\n---\r?\n?([\s\S]*)$/) : null;

  if (!match && !emptyMatch) {
    return { attributes: {}, body: content };
  }

  const yamlContent = match ? (match[1] ?? '') : '';
  const body = match ? (match[2] ?? '') : (emptyMatch?.[1] ?? '');

  try {
    const attributes = (parseYaml(yamlContent) as Record<string, unknown>) ?? {};
    return { attributes, body: body.trim() };
  } catch {
    return { attributes: {}, body: content };
  }
}
