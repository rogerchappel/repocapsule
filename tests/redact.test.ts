import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import { redactText } from '../src/redact.js';

test('redacts common token patterns and counts by kind', () => {
  const result = redactText('token=ghp_abcdefghijklmnopqrstuvwxyz123456 and Bearer abcdefghijklmnopqrstuvwxyz123456');

  assert.equal(result.text.includes('ghp_abcdefghijklmnopqrstuvwxyz123456'), false);
  assert.equal(result.text.includes('Bearer abcdefghijklmnopqrstuvwxyz123456'), false);
  assert.deepEqual(result.redactions.map((item) => item.kind), ['assignment-secret', 'bearer-token', 'github-token']);
});

test('redacts the current user home path by default', () => {
  const home = os.homedir();
  const result = redactText(`${home}/example/project`);

  assert.equal(result.text, '[REDACTED:home]/example/project');
  assert.deepEqual(result.redactions, [{ kind: 'home-path', count: 1 }]);
});
