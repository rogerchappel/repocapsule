import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
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

test('captures content when scanning with the minimum maxFileBytes value', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'repocapsule-min-bytes-'));
  try {
    await mkdir(path.join(root, 'src'));
    await writeFile(path.join(root, 'src', 'example.txt'), 'content');
    await writeFile(path.join(root, 'repocapsule.config.json'), JSON.stringify({
      include: ['src/**'],
      maxFileBytes: 1
    }));

    const capsule = await createCapsule({ root, config: await loadConfig(root) });
    const file = capsule.files.find((entry) => entry.path === 'src/example.txt');
    assert.ok(file);
    assert.equal(file.truncated, true);
    assert.equal(file.content, 'c');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('skips binary files while preserving ordinary UTF-8 text', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'repocapsule-binary-'));
  try {
    const binaryBytes = JSON.parse(
      await readFile(path.resolve('tests/fixtures/binary-bytes.json'), 'utf8')
    ) as number[];
    await mkdir(path.join(root, 'included'));
    await writeFile(path.join(root, 'included', 'image.png'), Buffer.from(binaryBytes));
    await writeFile(path.join(root, 'included', 'notes.txt'), 'Hello, Brisbane — こんにちは\n');
    await writeFile(path.join(root, 'repocapsule.config.json'), JSON.stringify({
      include: ['included/**']
    }));

    const capsule = await createCapsule({ root, config: await loadConfig(root) });

    assert.deepEqual(capsule.files.map((file) => file.path), ['included/notes.txt']);
    assert.equal(capsule.files[0]?.content, 'Hello, Brisbane — こんにちは\n');
    assert.deepEqual(capsule.warnings, ['skipped binary file: included/image.png']);
    assert.equal(stableJson(capsule).includes('\ufffd'), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
