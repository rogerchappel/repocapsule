import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { CONFIG_FILE, DEFAULT_CONFIG, loadConfig, writeDefaultConfig } from '../src/config.js';

async function withConfig(value: unknown, run: (root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'repocapsule-config-'));
  try {
    await writeFile(path.join(root, 'repocapsule.config.json'), JSON.stringify(value));
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

for (const [field, value, expected] of [
  ['schemaVersion', 2, 'schemaVersion must be 1'],
  ['include', 'README.md', 'include must be an array of strings'],
  ['include', ['README.md', 1], 'include[1] must be a string'],
  ['exclude', {}, 'exclude must be an array of strings'],
  ['commands', 'printf nope', 'commands must be an array of strings'],
  ['maxFileBytes', '64000', 'maxFileBytes must be a positive safe integer'],
  ['maxFileBytes', 0, 'maxFileBytes must be a positive safe integer'],
  ['maxFileBytes', 0.5, 'maxFileBytes must be a positive safe integer'],
  ['maxFileBytes', 1.5, 'maxFileBytes must be a positive safe integer'],
  ['maxFileBytes', Number.MAX_SAFE_INTEGER + 1, 'maxFileBytes must be a positive safe integer'],
  ['allowHomePaths', 1, 'allowHomePaths must be a boolean']
] as const) {
  test(`rejects invalid ${field}`, async () => {
    await withConfig({ [field]: value }, async (root) => {
      await assert.rejects(loadConfig(root), (error: Error) => {
        assert.match(error.message, /repocapsule\.config\.json/);
        assert.match(error.message, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        return true;
      });
    });
  });
}

test('rejects non-object configuration', async () => {
  await withConfig('invalid', async (root) => {
    await assert.rejects(loadConfig(root), /repocapsule\.config\.json: configuration must be a JSON object/);
  });
});

test('normalizes a valid partial configuration and preserves defaults', async () => {
  await withConfig({ exclude: ['private/**'], maxFileBytes: 1234 }, async (root) => {
    const config = await loadConfig(root);
    assert.deepEqual(config.include, DEFAULT_CONFIG.include);
    assert.deepEqual(config.exclude, [...DEFAULT_CONFIG.exclude, 'private/**']);
    assert.deepEqual(config.commands, []);
    assert.equal(config.schemaVersion, 1);
    assert.equal(config.maxFileBytes, 1234);
    assert.equal(config.allowHomePaths, false);
  });
});

test('preserves the minimum supported maxFileBytes value', async () => {
  await withConfig({ maxFileBytes: 1 }, async (root) => {
    const config = await loadConfig(root);
    assert.equal(config.maxFileBytes, 1);
  });
});

test('creates the default configuration in an empty directory', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'repocapsule-init-'));
  try {
    const configPath = await writeDefaultConfig(root);
    assert.equal(configPath, path.join(root, CONFIG_FILE));
    assert.deepEqual(JSON.parse(await readFile(configPath, 'utf8')), DEFAULT_CONFIG);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('refuses to overwrite an existing configuration', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'repocapsule-init-'));
  const configPath = path.join(root, CONFIG_FILE);
  const existing = '{\n  "schemaVersion": 1,\n  "include": ["CUSTOM.md"]\n}\n';
  try {
    await writeFile(configPath, existing);
    await assert.rejects(
      writeDefaultConfig(root),
      /repocapsule\.config\.json already exists; refusing to overwrite it/
    );
    assert.equal(await readFile(configPath, 'utf8'), existing);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
