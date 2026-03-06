import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AgentLoader } from '../../../src/loaders/agent-loader.js';

describe('AgentLoader', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'agent-test-'));
    const agentsDir = join(tempDir, '.agents');
    mkdirSync(agentsDir);
    writeFileSync(
      join(agentsDir, 'reviewer.md'),
      '---\nname: reviewer\ndescription: コードレビューエージェント\ntools: Read, Glob, Grep\nmodel: sonnet\n---\n# レビュー指示\n\nコードをレビューしてください',
    );
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('エージェント定義を読み込む', async () => {
    const loader = new AgentLoader();
    await loader.loadAgents([join(tempDir, '.agents')]);
    const agents = loader.listAgents();
    expect(agents.length).toBe(1);
    expect(agents[0]?.name).toBe('reviewer');
  });

  it('エージェント名で解決する', async () => {
    const loader = new AgentLoader();
    await loader.loadAgents([join(tempDir, '.agents')]);
    const agent = loader.resolve('reviewer');
    expect(agent).not.toBeNull();
    expect(agent?.tools).toEqual(['Read', 'Glob', 'Grep']);
    expect(agent?.model).toBe('sonnet');
    expect(agent?.instructions).toContain('レビュー指示');
  });

  it('存在しないエージェントは null を返す', async () => {
    const loader = new AgentLoader();
    await loader.loadAgents([join(tempDir, '.agents')]);
    expect(loader.resolve('nonexistent')).toBeNull();
  });
});
