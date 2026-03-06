#!/usr/bin/env node

import { ProviderFactory } from './providers/provider-factory.js';
import { Repl } from './cli/repl.js';
import { DEFAULT_CONFIG } from './types/index.js';
import { displayError } from './cli/display.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = {
    resumeId: undefined as string | undefined,
    listConversations: false,
    debug: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--resume') {
      const resumeId = args[i + 1];
      if (!resumeId || resumeId.startsWith('--')) {
        displayError('--resume には会話IDを指定してください');
        process.exit(1);
      }
      options.resumeId = resumeId;
      i++;
    } else if (arg === '--list') {
      options.listConversations = true;
    } else if (arg === '--debug') {
      options.debug = true;
    }
  }

  let provider;
  try {
    provider = ProviderFactory.create(DEFAULT_CONFIG);
  } catch (error) {
    displayError((error as Error).message);
    process.exit(1);
  }

  const repl = new Repl(provider, options);
  await repl.start();
}

main().catch((error) => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});
