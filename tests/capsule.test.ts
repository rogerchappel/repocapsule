import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createCapsule, stableJson } from '../src/capsule.js';
import { loadConfig } from '../src/config.js';

const fixtureRoot = path.resolve('fixtures/sample-repo');

test('creates a deterministic sanitized capsule from fixtures', async () => {
  const config = await loadConfig(fixtureRoot);
  const first = await createCapsule({ root: fixtureRoot, config });
  const second = await createCapsule({ root: fixtureRoot, config });

  assert.equal(first.commands.every((command) => command.durationMs > 0), true);
  assert.equal(second.commands.every((command) => command.durationMs > 0), true);
  for (const command of [...first.commands, ...second.commands]) {
    command.durationMs = 0;
  }
  assert.equal(stableJson(first), stableJson(second));
  assert.equal(first.files.some((file) => file.path === 'src/index.ts'), true);
  assert.equal(stableJson(first).includes('ghp_abcdefghijklmnopqrstuvwxyz123456'), false);
  assert.equal(first.commands[0]?.stdout.trim(), 'fixture ok');
});
