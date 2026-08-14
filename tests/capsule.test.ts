import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createCapsule, stableJson } from '../src/capsule.js';
import { loadConfig } from '../src/config.js';

const fixtureRoot = path.resolve('fixtures/sample-repo');

test('captures positive command durations and stable fields independently', async () => {
  const config = await loadConfig(fixtureRoot);
  const first = await createCapsule({ root: fixtureRoot, config });
  const second = await createCapsule({ root: fixtureRoot, config });

  // durationMs is measured at runtime — must be positive but varies between runs
  assert.equal(first.commands.every((command) => command.durationMs > 0), true);
  assert.equal(second.commands.every((command) => command.durationMs > 0), true);

  // other fields are truly deterministic when scanning the same repo
  const snapFirst = structuredClone(first);
  const snapSecond = structuredClone(second);
  // strip volatile timing so we can diff the stable core
  const noDur = (cmds: typeof first.commands) => cmds.map(
    ({ command, exitCode, stdout, stderr }) => ({ command, exitCode, stdout, stderr })
  );
  Object.assign(snapFirst, { commands: noDur(snapFirst.commands) });
  Object.assign(snapSecond, { commands: noDur(snapSecond.commands) });
  assert.equal(stableJson(snapFirst), stableJson(snapSecond), 'stable non-duration fields match');
  assert.equal(first.files.some((file) => file.path === 'src/index.ts'), true);
  assert.equal(second.files.some((file) => file.path === 'src/index.ts'), true);
  assert.equal(stableJson(first).includes('ghp_abcdefghijklmnopqrstuvwxyz123456'), false);
  assert.equal(first.commands[0]?.stdout.trim(), 'fixture ok');
  assert.equal(second.commands[0]?.stdout.trim(), 'fixture ok');

  // durationMs varies between runs (runtime measurement)
  const firstTotal = first.commands.reduce((s, c) => s + c.durationMs, 0);
  const secondTotal = second.commands.reduce((s, c) => s + c.durationMs, 0);
  assert.ok(firstTotal > 0 && secondTotal > 0);
});
